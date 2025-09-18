import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Info, Clock, AlertTriangle, CheckCircle, Trash2, Shield, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Delete Account | Zentry",
  description: "Delete your account and personal data from Zentry safely and transparently",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" className="gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">Delete Account</h1>
            <p className="text-xl text-muted-foreground">
              Delete your account and personal data safely
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Important Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Important:</strong> Account deletion is permanent and irreversible. 
              Make sure you have backed up any important information before proceeding.
            </AlertDescription>
          </Alert>

          {/* Direct Account Deletion Form */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Delete Your Account</h2>
            
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <UserX className="h-5 w-5" />
                  Account Deletion Request Form
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form action="mailto:privacidad@zentry.app" method="post" encType="text/plain">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="your.email@example.com"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input 
                        id="fullName" 
                        name="fullName" 
                        type="text" 
                        placeholder="Your full name as it appears in the app"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="residentialCode">Residential Code (if known)</Label>
                      <Input 
                        id="residentialCode" 
                        name="residentialCode" 
                        type="text" 
                        placeholder="Your residential code"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reason">Reason for Account Deletion (optional)</Label>
                      <Textarea 
                        id="reason" 
                        name="reason" 
                        placeholder="Tell us why you're deleting your account..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-100 border-red-200">
                      <input 
                        type="checkbox" 
                        id="confirm" 
                        name="confirm" 
                        required 
                        className="mt-1"
                      />
                      <Label htmlFor="confirm" className="text-red-800">
                        I understand that account deletion is permanent and irreversible. 
                        I confirm that I want to delete my account and all associated data.
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Deletion Request
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/eliminar-cuenta">Ver en Español</Link>
                    </Button>
                  </div>
                  
                  <input type="hidden" name="subject" value="Account Deletion Request" />
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Account Deletion Options */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">Account Deletion Options</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Option 1: From the app */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Delete from Mobile App
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-green-700">
                    The fastest and most direct way to delete your account.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-800">Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                      <li>Open the Zentry mobile app</li>
                      <li>Go to Account Settings</li>
                      <li>Select "Delete Account"</li>
                      <li>Confirm your decision</li>
                    </ol>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-green-600">
                      ✓ Immediate deletion<br/>
                      ✓ Automatic confirmation<br/>
                      ✓ Complies with Google Play policies
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: By email */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Mail className="h-5 w-5" />
                    Email Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-blue-700">
                    Alternative for users who prefer direct contact.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-800">Send email to:</p>
                    <p className="font-mono text-sm bg-blue-100 p-2 rounded text-blue-900">
                      privacidad@zentry.app
                    </p>
                    <p className="text-sm font-semibold text-blue-800">Subject:</p>
                    <p className="font-mono text-sm bg-blue-100 p-2 rounded text-blue-900">
                      "Account Deletion Request"
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-blue-600">
                      ✓ Response within 24-72 hours<br/>
                      ✓ Personalized support<br/>
                      ✓ Email confirmation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Required Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Required Information</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  To process your account deletion request, we need the following information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                  <li>Email address associated with your account</li>
                  <li>Full name as it appears in the application</li>
                  <li>Residential code (if you know it)</li>
                  <li>Confirmation that you want to permanently delete your account</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Data Information */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              What Data Gets Deleted
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Data that gets deleted */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Trash2 className="h-5 w-5" />
                    Completely Deleted Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-red-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Personal profile information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Email address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Alert and notification history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Profile photo and documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Application preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Notification tokens</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data that gets retained */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-5 w-5" />
                    Retained Data (Legally Required)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-amber-700">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Security logs (90 days)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Transaction records (fiscal period)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">Anonymized data for analysis</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800">
                      This data is kept secure and isolated, with restricted access only during the legally required period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Processing Time */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Processing Time</h2>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Deletion Timeframes</h3>
                    <div className="space-y-2 text-blue-700">
                      <p className="text-sm">
                        <strong>Deletion from app:</strong> Immediate (within 24 hours)
                      </p>
                      <p className="text-sm">
                        <strong>Email request:</strong> Processed within 24-72 business hours
                      </p>
                      <p className="text-sm">
                        <strong>Confirmation:</strong> You will receive an email confirmation once deletion is completed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Consequences */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Deletion Consequences</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What will happen:</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                      <li>You will lose immediate access to the Zentry application</li>
                      <li>You will not be able to recover information associated with your account</li>
                      <li>Residential access permissions will be revoked</li>
                      <li>You will no longer receive alerts or notifications</li>
                      <li>Your profile will be deleted from all systems</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Want to use Zentry again?</h4>
                    <p className="text-sm text-gray-600">
                      If you decide to return in the future, you will need to create a new account and go through 
                      the residential administrator approval process again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Compliance */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Compliance and Transparency</h2>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2">We comply with:</h3>
                    <ul className="space-y-1 text-green-700 text-sm">
                      <li>✓ Google Play Store policies</li>
                      <li>✓ Federal Law on Protection of Personal Data (Mexico)</li>
                      <li>✓ General Data Protection Regulation (GDPR)</li>
                      <li>✓ ARCO Rights (Access, Rectification, Cancellation, Opposition)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Important Links */}
          <section className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <p className="text-sm text-muted-foreground">
                For more information about how we handle your data, check our{" "}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/privacy">
                    <Info className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/terms">
                    Terms of Service
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
