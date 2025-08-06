'use client';
import { useState, useEffect } from 'react';

const LocalizedDate = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This effect runs only on the client, after hydration
    if (dateString) {
      setFormattedDate(new Date(dateString).toLocaleString());
    }
  }, [dateString]);

  // Render an empty string on the server and initial client render.
  // The useEffect will then trigger a re-render with the formatted date on the client.
  // This prevents a hydration mismatch.
  return <>{formattedDate}</>;
};

export default LocalizedDate;