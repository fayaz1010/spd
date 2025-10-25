
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobStatus } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      assignmentType,
      teamId,
      subcontractorId,
      scheduledDate,
      scheduledStartTime,
      notes,
    } = body;

    // Validate input
    if (!assignmentType || !['team', 'subcontractor'].includes(assignmentType)) {
      return NextResponse.json(
        { error: 'Invalid assignment type' },
        { status: 400 }
      );
    }

    if (assignmentType === 'team' && !teamId) {
      return NextResponse.json(
        { error: 'Team ID is required for team assignment' },
        { status: 400 }
      );
    }

    if (assignmentType === 'subcontractor' && !subcontractorId) {
      return NextResponse.json(
        { error: 'Subcontractor ID is required for subcontractor assignment' },
        { status: 400 }
      );
    }

    if (!scheduledDate) {
      return NextResponse.json(
        { error: 'Scheduled date is required' },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await prisma.installationJob.findUnique({
      where: { id },
      include: {
        lead: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      assignedAt: new Date(),
      assignmentMethod: 'MANUAL',
      assignedBy: 'admin', // TODO: Get from session
      scheduledDate: new Date(scheduledDate),
      scheduledStartTime: scheduledStartTime || '09:00',
      installationNotes: notes || job.installationNotes,
    };

    // Handle team assignment
    if (assignmentType === 'team') {
      // Verify team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      // Fetch team members with electrician credentials
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId: teamId,
          isActive: true,
          electricianId: {
            not: null,
          },
        } as any,
        include: {
          electrician: true,
        } as any,
        orderBy: {
          role: 'asc', // Prioritize by role (Lead Installer, etc.)
        },
      });

      updateData.teamId = teamId;
      updateData.subcontractorId = null;
      updateData.status = JobStatus.SCHEDULED;
      updateData.subConfirmationToken = null;

      // Auto-assign lead electrician from team
      // Priority: First team member with electrician credentials
      let leadElectricianInfo: any = null;
      if (teamMembers.length > 0 && (teamMembers[0] as any).electrician) {
        const electrician = (teamMembers[0] as any).electrician;
        updateData.leadElectricianId = electrician.id;
        
        // Validate electrician credentials
        const warnings: string[] = [];
        
        // Check license expiry
        if (electrician.licenseExpiry) {
          const expiryDate = new Date(electrician.licenseExpiry);
          const today = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            warnings.push(`⚠️ Electrical license expired ${Math.abs(daysUntilExpiry)} days ago`);
          } else if (daysUntilExpiry < 30) {
            warnings.push(`⚠️ Electrical license expires in ${daysUntilExpiry} days`);
          }
        }
        
        // Check CEC expiry
        if (electrician.cecExpiry) {
          const expiryDate = new Date(electrician.cecExpiry);
          const today = new Date();
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            warnings.push(`⚠️ CEC accreditation expired ${Math.abs(daysUntilExpiry)} days ago`);
          } else if (daysUntilExpiry < 30) {
            warnings.push(`⚠️ CEC accreditation expires in ${daysUntilExpiry} days`);
          }
        }
        
        // Check verification status
        if (!electrician.licenseVerified) {
          warnings.push('⚠️ Electrical license not verified');
        }
        if (!electrician.cecVerified) {
          warnings.push('⚠️ CEC accreditation not verified');
        }
        
        // Log warnings but don't block assignment
        if (warnings.length > 0) {
          console.warn(`Lead Electrician Warnings for ${electrician.firstName} ${electrician.lastName}:`, warnings);
        }
        
        leadElectricianInfo = {
          name: `${electrician.firstName} ${electrician.lastName}`,
          license: electrician.licenseNumber,
          cec: electrician.cecNumber,
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }

      // Update job
      const updatedJob = await prisma.installationJob.update({
        where: { id },
        data: updateData,
        include: {
          team: true,
          lead: true,
          leadElectrician: true,
        },
      });

      // TODO: Send email notification to team
      // TODO: Send confirmation email to customer

      return NextResponse.json({
        success: true,
        job: updatedJob,
        message: 'Job assigned to team successfully',
        leadElectrician: leadElectricianInfo,
      });
    }

    // Handle subcontractor assignment
    if (assignmentType === 'subcontractor') {
      // Verify subcontractor exists
      const subcontractor = await prisma.subcontractor.findUnique({
        where: { id: subcontractorId },
      });

      if (!subcontractor) {
        return NextResponse.json(
          { error: 'Subcontractor not found' },
          { status: 404 }
        );
      }

      // Generate confirmation token
      const confirmationToken = crypto.randomBytes(32).toString('hex');

      updateData.subcontractorId = subcontractorId;
      updateData.teamId = null;
      updateData.status = JobStatus.PENDING_SUB_CONFIRM;
      updateData.subConfirmationToken = confirmationToken;
      updateData.subConfirmedAt = null;
      updateData.subRejectedAt = null;

      // Update job
      const updatedJob = await prisma.installationJob.update({
        where: { id },
        data: updateData,
        include: {
          subcontractor: true,
          lead: true,
        },
      });

      // Send confirmation request email to subcontractor
      await sendSubcontractorConfirmationEmail({
        job: updatedJob,
        subcontractor,
        confirmationToken,
      });

      return NextResponse.json({
        success: true,
        job: updatedJob,
        message: 'Confirmation request sent to subcontractor',
      });
    }

    return NextResponse.json(
      { error: 'Invalid assignment type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error assigning job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to assign job' },
      { status: 500 }
    );
  }
}

async function sendSubcontractorConfirmationEmail({
  job,
  subcontractor,
  confirmationToken,
}: {
  job: any;
  subcontractor: any;
  confirmationToken: string;
}) {
  try {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/subcontractor/confirm/${confirmationToken}`;

    const scheduledDate = job.scheduledDate 
      ? new Date(job.scheduledDate).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'TBD';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #f97316, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #6b7280; }
            .detail-value { color: #111827; }
            .button { display: inline-block; background: linear-gradient(to right, #f97316, #ef4444); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Installation Job Request</h1>
              <p>Sun Direct Power</p>
            </div>
            <div class="content">
              <p>Hi ${subcontractor.contactName},</p>
              <p>We have a new solar installation job that we'd like to assign to your team. Please review the details below and confirm your availability.</p>
              
              <div class="job-details">
                <h3 style="margin-top: 0; color: #f97316;">Job Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Job Number:</span>
                  <span class="detail-value">${job.jobNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Customer:</span>
                  <span class="detail-value">${job.lead.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${job.lead.address}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Suburb:</span>
                  <span class="detail-value">${job.siteSuburb || 'TBD'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">System Size:</span>
                  <span class="detail-value">${job.systemSize}kW (${job.panelCount} panels)</span>
                </div>
                ${job.batteryCapacity > 0 ? `
                <div class="detail-row">
                  <span class="detail-label">Battery:</span>
                  <span class="detail-value">${job.batteryCapacity}kWh</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Proposed Date:</span>
                  <span class="detail-value">${scheduledDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Time:</span>
                  <span class="detail-value">${job.scheduledStartTime || '9:00 AM'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Estimated Duration:</span>
                  <span class="detail-value">${job.estimatedDuration} hours</span>
                </div>
                ${job.installationNotes ? `
                <div class="detail-row">
                  <span class="detail-label">Notes:</span>
                  <span class="detail-value">${job.installationNotes}</span>
                </div>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  Confirm Availability
                </a>
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Note:</strong> Please confirm or decline this job within 24 hours. If you need to propose an alternative date, you can do so through the confirmation page.
              </p>

              <div class="footer">
                <p>Sun Direct Power</p>
                <p>If you have any questions, please contact us directly.</p>
                <p style="font-size: 12px; margin-top: 20px;">
                  This is an automated email. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Log email details (in production, this would send via email service)
    console.log('📧 Subcontractor Confirmation Email');
    console.log('To:', subcontractor.email);
    console.log('Subject:', `New Installation Job: ${job.jobNumber}`);
    console.log('Confirmation URL:', confirmationUrl);
    console.log('HTML Content:', emailHtml.substring(0, 200) + '...');

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'Sun Direct Power <noreply@sundirectpower.com>',
    //   to: subcontractor.email,
    //   subject: `New Installation Job: ${job.jobNumber}`,
    //   html: emailHtml,
    // });

    return { success: true };
  } catch (error) {
    console.error('Error sending subcontractor email:', error);
    // Don't throw error - job assignment should still succeed even if email fails
    return { success: false, error };
  }
}
