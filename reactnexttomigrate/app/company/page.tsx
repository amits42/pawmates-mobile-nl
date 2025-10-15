"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ContactForm from "@/components/contact-form"
import * as LucideIcons from "lucide-react" // Import all Lucide icons under a namespace
import type { CompanyInfo, ServiceItem, Founder, SocialMedia } from "@/types/api"

export default function LandingPage() {
    // Hardcoded company information
    const currentCompany: CompanyInfo = {
        id: "default-id",
        companyName: "PawMates",
        tagline: "Your Pet's Best Friend, Always.",
        description:
            "At PawMates, we connect loving pet owners with trusted and experienced pet Zubo Walkers. Our mission is to provide peace of mind by ensuring your furry, feathered, or scaled family members receive the best care possible in the comfort of their own home or with a dedicated Zubo Walkers.",
        mission: "To provide exceptional, compassionate, and reliable pet care services.",
        contactEmail: "support@pawmates.com",
        contactPhone: "+1 (555) 123-4567",
        address: "123 Pet Lovers Lane, Animal City, PA 12345",
        operatingHours: "Mon-Fri: 9 AM - 6 PM, Sat: 10 AM - 4 PM",
        services: [
            { name: "Dog Walking", description: "Daily walks to keep your dog happy and healthy.", icon: "Dog" },
            { name: "Pet Sitting", description: "Overnight stays or daily visits for all types of pets.", icon: "Home" },
            { name: "Grooming", description: "Professional grooming services for a fresh look.", icon: "Scissors" },
            { name: "Training", description: "Basic obedience and behavior training.", icon: "Book" },
        ] as ServiceItem[],
        founders: [
            {
                name: "Jane Doe",
                bio: "Jane is a lifelong animal enthusiast with over 15 years of experience in pet care and animal welfare. She founded PawMates to create a reliable and compassionate community for pets and their owners.",
                imageUrl: "/placeholder.svg?height=100&width=100",
            },
            {
                name: "John Smith",
                bio: "John brings a strong background in technology and operations, ensuring PawMates runs smoothly and efficiently. His passion for pets drives his commitment to innovative solutions.",
                imageUrl: "/placeholder.svg?height=100&width=100",
            },
        ] as Founder[],
        socialMedia: {
            facebook: "https://facebook.com/pawmates",
            twitter: "https://twitter.com/pawmates",
            instagram: "https://instagram.com/pawmates",
            linkedin: "https://linkedin.com/company/pawmates",
            youtube: "https://youtube.com/pawmates",
            tiktok: "https://tiktok.com/@pawmates",
        } as SocialMedia,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const founders = currentCompany.founders || []
    const socialMedia = currentCompany.socialMedia || {}

    const socialMediaPlatforms = [
        { name: "Facebook", icon: LucideIcons.Facebook, url: socialMedia.facebook },
        { name: "Twitter", icon: LucideIcons.Twitter, url: socialMedia.twitter },
        { name: "Instagram", icon: LucideIcons.Instagram, url: socialMedia.instagram },
        { name: "LinkedIn", icon: LucideIcons.Linkedin, url: socialMedia.linkedin },
        { name: "YouTube", icon: LucideIcons.Youtube, url: socialMedia.youtube }
    ].filter((platform) => platform.url) // Filter out platforms without a URL

    return (
        <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <main className="flex-1">
                {/* Hero Section */}
                <section
                    className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center text-center bg-cover bg-center"
                    style={{
                        backgroundImage: `url(/placeholder.svg?height=1080&width=1920&query=happy-golden-retriever-and-calico-cat-playing-in-a-sunny-field)`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-800/60 to-purple-800/60"></div>
                    <div className="container px-4 md:px-6 text-center relative z-10">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <LucideIcons.PawPrint className="h-16 w-16 text-white animate-bounce" />
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg">
                                {currentCompany.companyName}: {currentCompany.tagline}
                            </h1>
                            <p className="max-w-[700px] text-lg text-gray-200 md:text-xl drop-shadow">{currentCompany.description}</p>
                            <div className="space-x-4 pt-4">
                                <Button
                                    asChild
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full shadow-lg transition-transform transform hover:scale-105"
                                >
                                    <Link href="/book-service">Book Now</Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg rounded-full shadow-lg transition-transform transform hover:scale-105 bg-transparent"
                                >
                                    <Link href="/login">Login</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-white">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-800">Our Services</h2>
                                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    We offer a range of services tailored to your pet's needs, ensuring they receive the best care.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
                            {(currentCompany.services as ServiceItem[]).map((service, index) => {
                                // Access the icon component dynamically from the LucideIcons namespace
                                const IconComponent = LucideIcons[service.icon as keyof typeof LucideIcons] || LucideIcons.PawPrint // Fallback icon
                                return (
                                    <Card
                                        key={index}
                                        className="flex flex-col items-center text-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <IconComponent className="h-12 w-12 text-blue-600 mb-4" />
                                        <CardTitle className="text-xl font-semibold mb-2">{service.name}</CardTitle>
                                        <CardContent className="text-gray-600 text-sm">{service.description}</CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-800">
                                    About {currentCompany.companyName}
                                </h2>
                                <p className="text-gray-600 md:text-xl/relaxed">{currentCompany.description}</p>
                                {currentCompany.mission && (
                                    <p className="text-gray-600 md:text-xl/relaxed">
                                        <span className="font-semibold">Our Mission:</span> {currentCompany.mission}
                                    </p>
                                )}
                                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                    <Button>Learn More</Button>
                                </div>
                            </div>
                            <Image
                                src="/placeholder.svg?height=400&width=600"
                                width={600}
                                height={400}
                                alt="About Us"
                                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                            />
                        </div>
                    </div>
                </section>

                {/* Founder Section */}
                {founders.length > 0 && (
                    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
                        <div className="container px-4 md:px-6 text-center">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Meet Our Founders</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                                    {founders.map((founder, index) => (
                                        <div key={index} className="flex flex-col items-center space-y-4">
                                            <Avatar className="h-24 w-24">
                                                <AvatarImage
                                                    src={founder.imageUrl || "/placeholder.svg?height=100&width=100&query=person-avatar"}
                                                    alt={founder.name}
                                                />
                                                <AvatarFallback>
                                                    {founder.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="text-2xl font-bold">{founder.name}</h3>
                                            <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                                {founder.bio}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Social Media Presence Section */}
                {socialMediaPlatforms.length > 0 && (
                    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-purple-100 to-blue-100">
                        <div className="container px-4 md:px-6 text-center">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-800">
                                    Join Our Community!
                                </h2>
                                <p className="max-w-[800px] mx-auto text-gray-700 md:text-xl/relaxed">
                                    Connect with us on social media for daily dose of adorable pets, helpful tips, and exclusive updates.
                                    We love sharing our passion for pets with you!
                                </p>
                                <div className="flex flex-wrap justify-center gap-6 py-8">
                                    {socialMediaPlatforms.map((platform, index) => {
                                        const IconComponent = platform.icon
                                        return (
                                            <Link
                                                key={index}
                                                href={platform.url!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center space-y-2 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group"
                                            >
                                                <IconComponent className="h-10 w-10 text-gray-600 group-hover:text-blue-600 transition-colors" />
                                                <span className="text-lg font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                                                    {platform.name}
                                                </span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Contact Us Section */}
                <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-white">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-800">Contact Us</h2>
                            <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Have questions or need assistance? Reach out to us!
                            </p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <LucideIcons.Mail className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">Email Us</h3>
                                        <p className="text-gray-600">{currentCompany.contactEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <LucideIcons.Phone className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">Call Us</h3>
                                        <p className="text-gray-600">{currentCompany.contactPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <LucideIcons.MapPin className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800">Visit Us</h3>
                                        <p className="text-gray-600">{currentCompany.address}</p>
                                    </div>
                                </div>
                                {currentCompany.operatingHours && (
                                    <div className="flex items-center space-x-4">
                                        <LucideIcons.Clock className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800">Operating Hours</h3>
                                            <p className="text-gray-600">{currentCompany.operatingHours}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                                <h3 className="font-semibold text-xl mb-4 text-gray-800">Send us a message</h3>
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 bg-gray-800 text-white text-center">
                <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/placeholder-logo.svg?height=24&width=24&query=pawmates-logo"
                            alt={`${currentCompany.companyName} Logo`}
                            width={24}
                            height={24}
                        />
                        <span className="font-semibold text-lg">{currentCompany.companyName}</span>
                    </div>
                    <nav className="flex gap-6 text-sm">
                        <Link href="#services" className="hover:text-blue-400 transition-colors">
                            Services
                        </Link>
                        <Link href="#about" className="hover:text-blue-400 transition-colors">
                            About Us
                        </Link>
                        <Link href="#contact" className="hover:text-blue-400 transition-colors">
                            Contact
                        </Link>
                        <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-of-service" className="hover:text-blue-400 transition-colors">
                            Terms of Service
                        </Link>
                    </nav>
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} {currentCompany.companyName}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
