import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Shield, Clock, Users, MapPin, Phone, Mail, Eye, UserCheck, MessageCircle, Stethoscope } from "lucide-react"
export default function Footer() {
    const WhatsAppIcon = ({ size = 24, bgColor = "#25D366", iconColor = "#FFFFFF" }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle cx="12" cy="12" r="12" fill={bgColor} />
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.418" fill={iconColor} />
        </svg>
    );
    return (
        <footer id="contact" className="bg-gray-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <div className="mb-2">
                            <Image
                                src="/logo/zubo-logo.svg"
                                alt="ZuboPets"
                                width={400}
                                height={400}
                                className="h-32 w-auto brightness-0 invert"
                            />
                        </div>
                        <p className="text-gray-400 mb-2 max-w-md leading-relaxed">
                            Trusted Dog Walking in Bengaluru.
                        </p>
                        {/* <div className="flex space-x-4">
          <Badge variant="secondary" className="bg-zubo-highlight-2 text-white">
            Trusted by 100+ pet parents
          </Badge>
        </div> */}

                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/#why-choose-us" className="hover:text-white transition-colors">
                                    Why Choose Zubo Pets
                                </Link>
                            </li>
                            <li>
                                <Link href="/#services" className="hover:text-white transition-colors">
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/public-cancellation-policy" className="hover:text-white transition-colors">
                                    Cancellation Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/#about" className="hover:text-white transition-colors">
                                    About Zubo Pets
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-white transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span>+91-8123168861</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <WhatsAppIcon size={16} />
                                <Link
                                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+918123168861"}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white"
                                >
                                    Text a Human
                                </Link>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <a
                                    href="mailto:care@zubopets.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    care@zubopets.com
                                </a>
                            </li>

                            <li className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>We’re here for you 5 am – 10 pm</span>
                            </li>
                        </ul>

                    </div>

                </div>
                <div className="border-t border-gray-800 mt-12 pt-8">

                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

                        <div className="text-center">

                            <p className="text-gray-400 text-sm mb-2"> Made with care for pets and pet parents.

                            </p>

                        </div>

                        <div className="text-sm flex space-x-2">

                            <Link href="/privacypolicy" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" > Privacy Policy

                            </Link>

                            <span className="text-gray-400">|</span>

                            <Link href="/termsofuse" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" > Terms of Use

                            </Link>
                        </div>
                        <p className="text-gray-400 text-sm">@ 2025 Zubo Pets. Operated by{" "}

                            <Link

                                href="https://www.endgateglobal.com/"

                                target="_blank"

                                rel="noopener noreferrer"

                                className="text-zubo-highlight-2 hover:text-white transition-colors underline"

                            >

                                EndGate Technologies Pvt. Ltd

                            </Link>

                        </p>

                    </div>

                </div>

            </div>

        </footer>
    )
}
