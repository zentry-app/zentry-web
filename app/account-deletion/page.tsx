import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Deletion - Zentry",
  description: "Delete your Zentry account and personal data",
  robots: "index, follow",
};

export default function AccountDeletionBotPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Account Deletion</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">How to Delete Your Account</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Option 1: Delete from Mobile App</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Open the Zentry mobile app → Go to Settings → Select "Delete Account" → Confirm deletion
                </p>
                <p className="text-xs text-green-600">✓ Immediate deletion within 24 hours</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Option 2: Email Request</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Send email to: <strong>privacidad@zentry.app</strong>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Subject: <strong>"Account Deletion Request"</strong>
                </p>
                <p className="text-xs text-blue-600">✓ Processed within 24-72 hours</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Required Information</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Email address associated with your account</li>
              <li>Full name as it appears in the application</li>
              <li>Residential code (if known)</li>
              <li>Confirmation that you want to permanently delete your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Deletion</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Deleted Data</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Personal profile information</li>
                  <li>• Email address</li>
                  <li>• Alert and notification history</li>
                  <li>• Profile photo and documents</li>
                  <li>• Application preferences</li>
                  <li>• Notification tokens</li>
                </ul>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-800 mb-2">Retained Data (Legal)</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Security logs (90 days)</li>
                  <li>• Transaction records (fiscal period)</li>
                  <li>• Anonymized data for analysis</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Important Notes</h2>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• Account deletion is <strong>permanent and irreversible</strong></li>
                <li>• You will lose access to the Zentry application immediately</li>
                <li>• You cannot recover your information after deletion</li>
                <li>• Residential access permissions will be revoked</li>
                <li>• To use Zentry again, you must create a new account</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Compliance</h2>
            <p className="text-sm text-gray-600 mb-2">
              This account deletion process complies with:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Google Play Store policies</li>
              <li>• Federal Law on Protection of Personal Data (Mexico)</li>
              <li>• General Data Protection Regulation (GDPR)</li>
              <li>• ARCO Rights (Access, Rectification, Cancellation, Opposition)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> privacidad@zentry.app<br/>
                <strong>Company:</strong> Zentry Tech Group S. de R.L. de C.V.<br/>
                <strong>Location:</strong> Mexicali, Baja California, México
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
