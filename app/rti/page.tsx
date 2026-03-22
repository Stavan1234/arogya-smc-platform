'use client';
import { useEffect, useState } from 'react';

interface RTIConfig {
  pio_name: string;
  pio_designation: string;
  pio_email: string;
  pio_phone: string;
  faa_name: string;
  faa_designation: string;
  faa_email: string;
  fee_application: string;
  fee_photocopy: string;
  fee_cd: string;
  disclosuresList: string[];
}

export default function RTIPage() {
  const [config, setConfig] = useState<RTIConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rti')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load RTI data', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12">Loading RTI information...</div>;
  if (!config) return <div className="text-center py-12 text-red-600">Failed to load RTI data.</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Right to Information – Arogya SMC</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Public Information Officer</h2>
          <p>{config.pio_name}, {config.pio_designation}<br />Email: {config.pio_email}<br />Phone: {config.pio_phone}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">First Appellate Authority</h2>
          <p>{config.faa_name}, {config.faa_designation}<br />Email: {config.faa_email}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Fee Structure</h2>
          <ul className="list-disc pl-6">
            <li>Application fee: ₹{config.fee_application} per request</li>
            <li>Photocopy: ₹{config.fee_photocopy} per page (A4)</li>
            <li>CD/DVD: ₹{config.fee_cd} per unit</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Proactive Disclosures</h2>
          <ul className="list-disc pl-6">
            {config.disclosuresList.map((item, i) => (
              <li key={i}><a href={`/reports/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-blue-600 hover:underline">{item}</a></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}