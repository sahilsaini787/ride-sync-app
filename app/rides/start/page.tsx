"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

/**
 * Ride Start Page
 * - Reads groupId from query string
 * - Displays basic ride started info
 */
const RideStartPage: React.FC = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold text-primary mb-4">Ride Started</h1>
      {groupId ? (
        <div className="text-lg text-muted-foreground">
          Group ID: <span className="font-mono">{groupId}</span>
        </div>
      ) : (
        <div className="text-lg text-red-600">No group selected.</div>
      )}
    </div>
  );
};

export default RideStartPage;
