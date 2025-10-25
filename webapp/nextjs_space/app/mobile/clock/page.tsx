'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function MobileClockPage() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('Getting location...');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);

  useEffect(() => {
    getLocation();
    fetchTodayAttendance();
  }, []);

  async function getLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(loc);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}`
            );
            const data = await response.json();
            setAddress(data.display_name || 'Location found');
          } catch (error) {
            setAddress(`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setAddress('Location unavailable');
        }
      );
    } else {
      setAddress('GPS not supported');
    }
  }

  async function fetchTodayAttendance() {
    try {
      const today = new Date().toISOString().split('T')[0];
      // This would need to get the current user's staffId
      // For now, we'll check if there's attendance today
      setTodayAttendance(null); // Placeholder
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }

  async function handleClockIn() {
    if (!location) {
      alert('Please enable location services');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/staff/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: address
        })
      });

      const data = await response.json();

      if (data.success) {
        setClockedIn(true);
        setTodayAttendance(data.attendance);
        alert('✓ Clocked in successfully!');
      } else {
        alert(data.error || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    } finally {
      setLoading(false);
    }
  }

  async function handleClockOut() {
    if (!location) {
      alert('Please enable location services');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/staff/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: address
        })
      });

      const data = await response.json();

      if (data.success) {
        setClockedIn(false);
        setTodayAttendance(data.attendance);
        alert(`✓ Clocked out! Total hours: ${data.summary.totalHours}`);
      } else {
        alert(data.error || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clock In/Out</h1>
        <p className="text-gray-600">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Current Time */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {format(new Date(), 'HH:mm')}
        </div>
        <div className="text-gray-600">Current Time</div>
      </div>

      {/* Location Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 mb-1">Your Location</div>
            <div className="text-sm text-gray-600">{address}</div>
            {location && (
              <div className="text-xs text-gray-400 mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {todayAttendance && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Today's Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Clock In</div>
              <div className="text-lg font-semibold text-green-600">
                {todayAttendance.clockIn ? format(new Date(todayAttendance.clockIn), 'HH:mm') : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Clock Out</div>
              <div className="text-lg font-semibold text-red-600">
                {todayAttendance.clockOut ? format(new Date(todayAttendance.clockOut), 'HH:mm') : '-'}
              </div>
            </div>
            {todayAttendance.totalHours > 0 && (
              <div className="col-span-2">
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold text-blue-600">
                  {todayAttendance.totalHours.toFixed(1)}h
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clock In/Out Buttons */}
      <div className="space-y-4">
        {!clockedIn && !todayAttendance?.clockIn && (
          <button
            onClick={handleClockIn}
            disabled={loading || !location}
            className="w-full py-6 bg-green-600 text-white rounded-2xl shadow-lg font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Clocking In...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>CLOCK IN</span>
              </div>
            )}
          </button>
        )}

        {(clockedIn || (todayAttendance?.clockIn && !todayAttendance?.clockOut)) && (
          <button
            onClick={handleClockOut}
            disabled={loading || !location}
            className="w-full py-6 bg-red-600 text-white rounded-2xl shadow-lg font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Clocking Out...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>CLOCK OUT</span>
              </div>
            )}
          </button>
        )}

        {todayAttendance?.clockOut && (
          <div className="text-center py-6 bg-gray-50 rounded-2xl">
            <div className="text-green-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-semibold text-gray-800">Day Complete</div>
            <div className="text-sm text-gray-600">You've clocked out for today</div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <a
          href="/mobile/schedule"
          className="p-4 bg-white rounded-xl shadow text-center"
        >
          <div className="text-blue-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Schedule</div>
        </a>

        <a
          href="/mobile/timesheets"
          className="p-4 bg-white rounded-xl shadow text-center"
        >
          <div className="text-green-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-sm font-medium">Timesheet</div>
        </a>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex gap-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Your location is recorded for attendance verification. Make sure you're at the job site before clocking in.
          </div>
        </div>
      </div>
    </div>
  );
}
