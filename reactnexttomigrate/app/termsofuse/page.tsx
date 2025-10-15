import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-zubo-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex h-8 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-zubo-text hover:text-zubo-primary transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zubo-text mb-2">Terms of Use</h1>
            <p className="text-gray-600">Posted as of 7 September 2025</p>
            <p className="text-gray-600">Last updated as of 7 September 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="mb-8 p-6 bg-zubo-primary/10 rounded-lg">
              <p className="text-zubo-text leading-relaxed">
                This Website is created and operated by <strong>EndGate Technologies Pvt. Ltd.</strong>, (hereinafter
                referred to as "We", "Our", and "Us") having its registered address at "The Ambience, #2606, 27 Main Rd,
                HSR Layout, Bangalore - 560102 (KA)" and operating under the brand name <strong>"Zubo Pets"</strong>{" "}
                ("Trade Name"). We intend to ensure your steady commitment to the usage of this Website and the services
                provided by us through our Website "www.zubopets.com".
              </p>
            </div>

            {/* Definitions */}
            <section className="mb-8">
              <p className="text-zubo-text leading-relaxed">
                For the purpose of these Terms of Use ("Terms of Use"), wherever the context so requires, "We", "Our",
                and "Us" shall mean and refer to the Website. "You", "Your", "Yourself", "User" shall mean and refer to
                natural and legal individuals who shall be users of this Website provided by us and who is competent to
                enter into binding contracts, as per law. "Third Parties" refer to any Website, platform or individual
                apart from the Users and the creator of this Website.
              </p>
            </section>

            {/* General Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">General Terms</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  The headings of each section in these Terms of Use are only for the purpose of organizing the various
                  provisions under these Terms of Use in an orderly manner and shall be used by you to interpret the
                  provisions contained herein in a manner as may apply to you.
                </p>
                <p>
                  The use of this Website is solely governed by these Terms of Use, Privacy Policy that may be uploaded
                  on the Website and any modifications or amendments made thereto by us from time to time, at our sole
                  discretion.
                </p>
                <p>
                  You expressly agree and acknowledge that these Terms of Use and Privacy Policy are co-terminus in
                  nature and that expiry/termination of either one will lead to the termination of the other.
                </p>
                <p>
                  We reserve the sole and exclusive right to amend or modify these Terms of Use without any prior
                  permission or intimation to you, and you expressly agree that any such amendments or modifications
                  shall come into effect immediately.
                </p>
              </div>
            </section>

            {/* Platform Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Platform Overview</h2>
              <div className="bg-zubo-highlight-2/10 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The Platform is an online e-commerce website founded as a pet care services startup that aims to
                  consistently provide reliable and trustworthy services. The Platform is committed to providing
                  services for all pet's daily routine including a Walker, Groomer, Vet, Trainer, Boarding, etc.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The role of the Platform is to create an online marketplace that consists of various vendors /
                  partners listing their pet care services of general utility in nature. The Platform undertakes a
                  screening / review of each service and the qualifications before listing it out to confirm the
                  Partner's service features.
                </p>
              </div>
            </section>

            {/* Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Registration</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Registration on the Platform is mandatory for Users of the Website. The Users can register by providing
                the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Full Name</li>
                <li>Email</li>
                <li>Phone Number</li>
              </ul>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Eligibility</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  You represent and warrant that you are competent and eligible to enter into legally binding agreements
                  and of age and that you have the requisite authority to bind yourself to these Terms of Use following
                  the Law. However, if you are a minor using this Website, you may do so with the consent of your legal
                  guardian.
                </p>
                <p>
                  You further represent that you will comply with these Terms of Use and all applicable local, state,
                  national and international laws, rules and regulations.
                </p>
              </div>
            </section>

            {/* Payment Gateway */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Payment Gateway</h2>
              <p className="text-gray-700 leading-relaxed">
                For making all payments for services on the Website, you shall be required to make payment for which you
                will be redirected to a third-party payment gateway that we may have an agreement with. The payment
                gateway consists of Debit Card/Credit Card/Net Banking/UPI and other wallet options. You shall be
                governed under the concerned payment gateway's Terms and Conditions and other Policies for the purpose
                of all payment-related aspects.
              </p>
            </section>

            {/* Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Content</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  All text, graphics, User interfaces, visual interfaces, photographs, trademarks, logos, brand names,
                  descriptions, sounds, music and artwork (collectively, 'Content'), is generated / provided or based on
                  information provided by the users or third parties and We have no control and make no guarantees
                  regarding the quality, the accuracy, integrity or genuineness of such content.
                </p>
                <p>
                  All the Content displayed on the Website is subject to copyright and shall not be reused by You (or a
                  third party) without the prior written consent from Us and the copyright owner.
                </p>
                <p>
                  You have a personal, non-exclusive, non-transferable, revocable, limited privilege to access the
                  content on the Website. You shall not copy, adapt, and modify any content without written permission
                  from Us.
                </p>
              </div>
            </section>

            {/* Indemnity */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Indemnity</h2>
              <div className="bg-red-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree to indemnify, defend and hold harmless Us, and our respective directors, officers, employees
                  and agents (collectively, "Parties"), from and against any losses, liabilities, claims, damages,
                  demands, costs and expenses asserted against or incurred by Us that arise out of, result from, or
                  maybe payable by, any breach or non-performance of any representation, warranty, covenant or agreement
                  made or obligation to be performed according to these Terms of Use.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You agree to fully cooperate in indemnifying Us at your expense. You also agree not to settle with any
                  party without consent from Us.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>We are not responsible for any consequences arising out of the following events:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>If the Website is inoperative/non-responsive due to any connectivity errors</li>
                  <li>If you have fed incorrect information or data or for any deletion of data</li>
                  <li>If there is an undue delay or inability to communicate through email</li>
                  <li>If there is any deficiency or defect in the Services managed by Us</li>
                  <li>If there is a failure in the functioning of any other service provided by Us</li>
                </ul>
                <p>
                  To the fullest extent permitted by law, We shall not be liable to You or any other party for any loss
                  or damage, regardless of the form of action or basis of any claim.
                </p>
              </div>
            </section>

            {/* User Obligations */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">User Obligations and Formal Undertakings</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>You agree and acknowledge that you are a restricted user of this Website and you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Agree to provide genuine credentials during the process whenever required</li>
                  <li>Agree to ensure all information provided is valid and up-to-date</li>
                  <li>Are solely responsible for maintaining the confidentiality of your account</li>
                  <li>Authorize the Website to use, store or process personal information for service optimization</li>
                  <li>Are bound not to cut, copy, modify, recreate, or reverse engineer any Website content</li>
                  <li>Agree not to access the Website through unauthorized means</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Intellectual Property Rights</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  All logos, trademarks, brand names, service marks, domain names, including material, designs, and
                  graphics created by and developed by either the Website or such other third party and other
                  distinctive brand features of the Website are the property of the Website or the respective copyright
                  or trademark owner.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You shall not use any of the intellectual property displayed on the Website in any manner that is
                  likely to cause confusion among existing or prospective users of the Website.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Termination</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  We reserve the right, in its sole discretion, to unilaterally terminate Your access to the Website, or
                  any portion thereof, at any time, without notice or cause.
                </p>
                <p>
                  We also reserve the universal right to deny access to You, to any/all of are on its Website without
                  any prior notice/explanation to protect the interests of the Website and/or other Users.
                </p>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Dispute Resolution and Jurisdiction</h2>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  In the event of any dispute arising out of or in connection with this agreement, the parties shall, at
                  first instance, attempt to resolve the dispute by mediation through appointing a mutually agreed upon
                  third party mediator. The language of arbitration shall be English. The seat of arbitration shall be
                  Bengaluru, Karnataka, India.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You expressly agree that the Terms of Use, Privacy Policy and any other agreements entered into
                  between the Parties are governed by the laws, rules, and regulations of India.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zubo-text mb-4">Contact Us</h2>
              <div className="bg-zubo-primary/10 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Terms of Use, the practices of the Website, or your experience,
                  you can contact us by emailing us at{" "}
                  <a href="mailto:care@zubopets.com" className="text-zubo-primary hover:underline">
                    care@zubopets.com
                  </a>{" "}
                  or by writing to us at:
                </p>
                <div className="text-gray-700 leading-relaxed">
                  <p className="font-semibold">Zubo Pets</p>
                  <p>Endgate Technologies Pvt. Ltd.</p>
                  <p>The Ambience, #2606</p>
                  <p>27 Main Rd, HSR Layout</p>
                  <p>Bangalore - 560102 (KA)</p>
                </div>
              </div>
            </section>
          </div>
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
            © 2025 Zubo Pets. All rights reserved. |{" "}
            <span className="text-gray-300">
              Zubo Pets is a brand operated by{" "}
              <a
                href="https://www.endgateglobal.com/copy-of-strategy-nsulting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zubo-highlight-2 hover:text-white transition-colors"
              >
                EndGate Technologies Pvt. Ltd.
              </a>
            </span>
          </p>
        </div>
      </footer>
    </div>
  )
}
