import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Header with Logo and Back Button */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex h-8 items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-zubo-text hover:text-zubo-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/zubo-logo.svg"
                alt="ZuboPets"
                width={320}
                height={320}
                className="h-24 w-auto"
                priority
              />            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-zubo-text mb-4">Privacy Policy</h1>
            <div className="text-gray-600">
              <p>Posted as of 7 September 2025</p>
              <p>Last updated as of 7 September 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="text-lg mb-6">
              EndGate Technologies Pvt. Ltd. ("Company", "we", "us") doing business as{" "}
              <strong className="text-zubo-primary">Zubo Pets</strong> is a private limited company with its registered
              office at The Ambience, #2606, 27 Main Rd, HSR Layout, Bangalore - 560102 (KA), operates the website{" "}
              <Link href="/" className="text-zubo-primary hover:underline">
                zubopets.com
              </Link>{" "}
              (hereinafter referred to as the "Platform"). The Company is committed to protecting Your privacy and the
              information that You share while using the Platform. We value the trust You place in Us. That's why We
              maintain the highest security standards for securing the transactions and Your information.
            </p>

            <p className="mb-6">
              This privacy policy ("Privacy Policy") specifies the manner in which personal data and other information
              is collected, received, stored, processed, disclosed, transferred, dealt with, or otherwise handled by the
              Company. This Privacy Policy does not apply to information that You provide to, or that is collected by,
              any third-party through the Platform, and any Third-Party Sites (defined below) that You access or use in
              connection with the Services offered on the Platform.
            </p>

            <div className="bg-zubo-primary/10 border-l-4 border-zubo-primary p-6 mb-8 rounded-r-lg">
              <p className="font-semibold text-zubo-text mb-2">Important Notice</p>
              <p className="text-sm">
                Please read the Privacy Policy carefully prior to using or registering on the Platform or accessing any
                material, information or availing any Services through the Platform.
              </p>
            </div>

            <p className="mb-8">
              By visiting the Platform or setting up/creating an account on the Platform for availing the Services and
              clicking on the "I accept" button provided on the Platform, You ("You", "Your", "Yourself" as applicable)
              accept and agree to be bound by the terms and conditions of this Privacy Policy and consent to the Company
              collecting, storing, processing, transferring, and sharing information including Your Personal Information
              in accordance with this Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">1. Usage of Information</h2>
            <p className="mb-4">
              The information as specified in Clause 1, may be used by the Company for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>for Your registration, login, and management of account on the Platform;</li>
              <li>to confirm Your identity directly and/or through third parties;</li>
              <li>to provide You Services and improve the Services;</li>
              <li>
                remembering Your Personal Information so that You are not required to re-enter it the next time You
                visit the Platform;
              </li>
              <li>
                to understand Your preferences and to enhance and customize Your experience of using the Service and the
                Platform;
              </li>
              <li>for providing customized user relevant suggestion / Services;</li>
              <li>
                to communicate with You through mail, e-mail, and telephone or through any other mode of communication,
                in connection with the Service, or other products or services of the Company;
              </li>
              <li>to respond to Your comments, requests, reviews, and questions and provide better Services;</li>
              <li>
                to enforce, communicate important notices, updates, or changes in the Services, use of the Platform and
                the terms/policies including Terms which govern the relationship between You and the Company;
              </li>
              <li>
                to detect, prevent and protect Us from any errors, fraud or other criminal or prohibited activity on the
                Platform;
              </li>
              <li>
                for internal purposes such as auditing, data analysis, research and improvement relating to the Platform
                or the Service;
              </li>
              <li>for promotion and marketing purposes;</li>
              <li>
                for sharing such information with any third party, including any service providers and any of Our group
                companies, in the course of providing the Services through the Platform;
              </li>
              <li>
                to help promote a safe service on the Platform and protect the security and integrity of the Platform,
                the Services, and the users.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">
              2. Collection of Information by Third-Party Sites and Advertisers
            </h2>
            <p className="mb-6">
              When You use the Platform, there may be certain links which may direct You to other websites/platforms or
              applications not operated/maintained by the Company ("Third Party Site(s)"). The manner in which Your
              information is collected, received, stored, processed, disclosed, transferred, dealt with and handled by
              such Third Party Site(s) is governed by the terms and conditions and privacy policy of the respective
              Third Party Site(s).
            </p>

            <h3 className="text-xl font-semibold text-zubo-text mt-6 mb-3">Cookies</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                A cookie is a small amount of information that's downloaded to Your computer or device when You visit
                the Platform. We use a number of different cookies, including functional, performance, advertising, and
                social media or content cookies.
              </li>
              <li>
                The length of time that a cookie remains on Your computer or mobile device depends on whether it is a
                "persistent" or "session" cookie. Session cookies last until You stop browsing and persistent cookies
                last until they expire or are deleted.
              </li>
              <li>
                You can control and manage cookies in various ways. Please keep in mind that removing or blocking
                cookies can negatively impact Your user experience and parts of the Platform may not be fully accessible
                to You.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">3. Disclosure to Third Parties</h2>
            <p className="mb-4">
              The Company may disclose Your information including Personal Information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>If required to do so by law and if such action is necessary to comply with legal obligations;</li>
              <li>To protect and defend the rights or property of the Company and other users;</li>
              <li>To protect the personal safety of the Company, users, or any person in an emergency;</li>
              <li>To facilitate the provision of Services including the Platform;</li>
              <li>To third parties who provide services such as auditing, data analysis, and platform improvement.</li>
            </ul>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">4. Security</h2>
            <p className="mb-6">
              The Company uses reasonable security measures, at the minimum those mandated under applicable laws to
              safeguard and protect Your data and information. The Company has implemented measures to protect against
              unauthorized access to, and unlawful interception of Your information. However, security risk cannot be
              completely eliminated while using the internet.
            </p>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">5. Policy Towards Children</h2>
            <p className="mb-6">
              The Platform is intended for a general audience and not for use by anyone younger than the age of 18. In
              the event the Platform and the Services are being accessed by a person below the age of 18 ("Minor"), such
              access shall be deemed to be with the consent of the guardian of such Minor.
            </p>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">6. User Discretion</h2>
            <p className="mb-6">
              Subject to limitations in applicable law, You are entitled to object to or request the restriction of
              processing of Your Personal Information, and to request access to, rectification, erasure and portability
              of Your own Personal Information. If You desire to withdraw Your consent or delete Your Personal
              Information, You can contact Us at{" "}
              <a href="mailto:care@zubopets.com" className="text-zubo-primary hover:underline">
                care@zubopets.com
              </a>
              .
            </p>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">7. Grievances</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <p className="mb-4">
                In the event You have any grievances relating to the Privacy Policy, please inform the Company within 24
                hours by contacting our Grievance Redressal Officer:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> Rahul Kumar
                </p>
                <p>
                  <strong>Phone:</strong> +91 95133 98352
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:care@zubopets.com" className="text-zubo-primary hover:underline">
                    care@zubopets.com
                  </a>
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">8. Amendments</h2>
            <p className="mb-6">
              We reserve the unconditional right to change, modify, add, or remove portions of this Privacy Policy at
              any time, without specifically notifying You of such changes. Any changes or updates will be effective
              immediately. You should review this Privacy Policy regularly for changes.
            </p>

            <h2 className="text-2xl font-bold text-zubo-text mt-8 mb-4">Delete Account</h2>
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <p className="text-red-800">
                To request deletion of your account and data, email us at{" "}
                <a href="mailto:care@zubopets.com" className="text-red-600 hover:underline font-semibold">
                  care@zubopets.com
                </a>{" "}
                with the subject "Delete My Account". We will honor your request within 15 days unless we are legally
                required to retain anything.
              </p>
            </div>
          </div>

          {/* Back to Top Button */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-zubo-primary text-white rounded-lg hover:bg-zubo-primary/90 transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Zubo Pets. A brand operated by{" "}
            <a
              href="https://www.endgateglobal.com/copy-of-strategy-nsulting"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zubo-highlight-2 hover:text-white transition-colors"
            >
              EndGate Technologies Pvt. Ltd.
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
