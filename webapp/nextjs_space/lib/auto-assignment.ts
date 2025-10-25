
import { prisma } from "@/lib/db";

interface TeamAvailability {
  teamId: string;
  teamName: string;
  distance: number;
  availableDate: Date;
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Find the nearest available team for a job
export async function findNearestTeam(
  jobLatitude: number,
  jobLongitude: number,
  jobSuburb: string,
  startDate: Date = new Date(),
  jobType?: string
): Promise<TeamAvailability | null> {
  // Get all active teams
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    include: {
      jobs: {
        where: {
          scheduledDate: {
            gte: startDate,
          },
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"],
          },
        },
      },
      availability: {
        where: {
          date: {
            gte: startDate,
          },
        },
      },
    },
  });

  if (teams.length === 0) {
    return null;
  }

  const availableTeams: TeamAvailability[] = [];

  // Check each team for the next 14 days
  for (const team of teams) {
    // Check if team has required specialization for job type
    // If jobType is specified and team has specializations, check if team can handle this job type
    if (jobType && team.specialization && team.specialization.length > 0) {
      const hasSpecialization = team.specialization.includes(jobType);
      if (!hasSpecialization) {
        continue;
      }
    }

    // Check if job suburb is in team's service suburbs
    const servesSuburb =
      !jobSuburb ||
      !team.serviceSuburbs ||
      team.serviceSuburbs.length === 0 ||
      team.serviceSuburbs.some(
        (suburb) => suburb.toLowerCase() === jobSuburb.toLowerCase()
      );

    if (!servesSuburb) {
      continue;
    }

    // Check availability for next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      checkDate.setHours(0, 0, 0, 0);

      // Check if team has availability record for this date
      const availabilityRecord = team.availability.find((avail) => {
        const availDate = new Date(avail.date);
        availDate.setHours(0, 0, 0, 0);
        return availDate.getTime() === checkDate.getTime();
      });

      // If there's a specific availability record, check if team is available
      if (availabilityRecord && !availabilityRecord.isAvailable) {
        continue;
      }

      // Count jobs scheduled on this date
      const jobsOnDate = team.jobs.filter((job) => {
        if (!job.scheduledDate) return false;
        const jobDate = new Date(job.scheduledDate);
        jobDate.setHours(0, 0, 0, 0);
        return jobDate.getTime() === checkDate.getTime();
      });

      const maxJobsForDate = availabilityRecord?.maxJobs || team.maxConcurrentJobs;

      // Team is available if they have capacity
      if (jobsOnDate.length < maxJobsForDate) {
        // Calculate distance (if we have team location, otherwise use 0)
        // For now, we'll prioritize by service area match
        const distance = 0; // Placeholder - could enhance with team office location

        availableTeams.push({
          teamId: team.id,
          teamName: team.name,
          distance,
          availableDate: checkDate,
        });
        break; // Found available date for this team, move to next team
      }
    }
  }

  if (availableTeams.length === 0) {
    return null;
  }

  // Sort by distance (for now all 0, so will just pick first)
  availableTeams.sort((a, b) => a.distance - b.distance);

  return availableTeams[0];
}

// Auto-assign a job to the nearest available team
export async function autoAssignJob(jobId: string): Promise<{
  success: boolean;
  message: string;
  assignedTeam?: string;
  scheduledDate?: Date;
}> {
  try {
    // Get job details
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
      },
    });

    if (!job) {
      return { success: false, message: "Job not found" };
    }

    if (job.status !== "PENDING_SCHEDULE") {
      return {
        success: false,
        message: "Job is not in PENDING_SCHEDULE status",
      };
    }

    // Check if job has location data
    if (!job.siteLatitude || !job.siteLongitude) {
      return {
        success: false,
        message: "Job does not have location data",
      };
    }

    // Find nearest available team
    const nearestTeam = await findNearestTeam(
      job.siteLatitude,
      job.siteLongitude,
      job.siteSuburb || "",
      new Date()
    );

    if (!nearestTeam) {
      return {
        success: false,
        message: "No available teams found in the next 14 days",
      };
    }

    // Assign job to team
    await prisma.installationJob.update({
      where: { id: jobId },
      data: {
        teamId: nearestTeam.teamId,
        scheduledDate: nearestTeam.availableDate,
        scheduledStartTime: "09:00",
        status: "SCHEDULED",
        assignedAt: new Date(),
        assignmentMethod: "AUTO",
        customerScheduledAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Job successfully auto-assigned",
      assignedTeam: nearestTeam.teamName,
      scheduledDate: nearestTeam.availableDate,
    };
  } catch (error) {
    console.error("Error auto-assigning job:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Process all overdue jobs (past scheduling deadline)
export async function processOverdueJobs(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    jobId: string;
    jobNumber: string;
    success: boolean;
    message: string;
  }>;
}> {
  try {
    // Find jobs that are past scheduling deadline
    const overdueJobs = await prisma.installationJob.findMany({
      where: {
        status: "PENDING_SCHEDULE",
        schedulingDeadline: {
          lt: new Date(),
        },
      },
      include: {
        lead: true,
      },
    });

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const job of overdueJobs) {
      const result = await autoAssignJob(job.id);
      results.push({
        jobId: job.id,
        jobNumber: job.jobNumber,
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      processed: overdueJobs.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error("Error processing overdue jobs:", error);
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }
}
