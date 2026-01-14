/**
 * Defines the structure for the aggregated statistics data
 * displayed on the Admin Dashboard Overview page.
 */
export interface DashboardStats {
  // --- 1. Membership Metrics ---
  membership: {
    /** Total number of users registered in the system (all roles). */
    totalMembers: number;
    /** Total number of members with 'active' profileStatus. */
    totalActiveMembers: number;
    /** Total number of users with the 'alumni' role. */
    totalAlumni: number;
    /** Number of user applications or profiles currently awaiting admin review. */
    pendingApplications: number;
  };

  // --- 2. Activity & Content Metrics ---
  activities: {
    /** Total number of events created in the system (past and future). */
    totalEvents: number;
    /** Number of events scheduled in the future (within a defined timeframe). */
    upcomingEvents: number;
    /** Total number of certificates issued or available. */
    totalCertificates: number;
    /** Total number of projects managed or completed. */
    totalProjects: number;
  };

  // --- 3. Financial & Asset Metrics ---
  resources: {
    /** Total number of sponsors recorded. */
    totalSponsors: number;
    /** Number of sponsors with a currently active agreement/contribution. */
    activeSponsors: number;
    /** Total number or value of physical/digital assets managed by the club. */
    totalAssets: number; // Represents a count or a monetary value, depending on implementation
  };
}
