import Link from "next/link"
import { BadgeCheck, ChevronRight, HeartHandshake, PawPrint, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-static"

function Swatch({
  name,
  className,
  hex,
  usage,
}: {
  name: string
  className: string
  hex: string
  usage: string
}) {
  return (
    <div className="rounded-lg border bg-white">
      <div className={`h-20 w-full rounded-t-lg ${className}`} />
      <div className="p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zubo-text">{name}</span>
          <span className="font-mono text-xs text-gray-500">{hex}</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">{usage}</p>
      </div>
    </div>
  )
}

export default function BrandPreviewPage() {
  return (
    <main className="min-h-screen bg-zubo-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Designer reference */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-zubo-text">Zubo Brand Color Review</CardTitle>
            <CardDescription className="text-zubo-text">
              Practical, accessible mappings using your Tailwind brand tokens. This is additive only and won{"'"}t
              change existing screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-white p-2">
              {/* Using the provided source URL directly as requested */}
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/zubo%20colour.JPG-H1btlSQtIYL47aTFrMWmCK5UwfIfgL.jpeg"
                alt="Designer provided color palette reference"
                className="w-full rounded"
              />
            </div>
            <p className="text-sm text-gray-600">
              Tip: Use Primary for key actions, Graphite Gray for body text, Coral/Bronze for accents, and Moss Green
              for positive states and focus rings.
            </p>
          </CardContent>
        </Card>

        {/* Palette swatches */}
        <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Swatch
            name="Primary"
            className="bg-zubo-primary-500"
            hex="#253347"
            usage="Key actions, headers; use white text"
          />
          <Swatch
            name="Background"
            className="bg-zubo-background-200"
            hex="#FBF9F6"
            usage="Base canvas; keep content airy"
          />
          <Swatch
            name="Highlight 1"
            className="bg-zubo-highlight-1-400"
            hex="#E7A79D"
            usage="Warm accents; labels, chips, promos"
          />
          <Swatch
            name="Highlight 2"
            className="bg-zubo-highlight-2-500"
            hex="#B8835C"
            usage="Premium accents; icon hovers/borders"
          />
          <Swatch name="Accent" className="bg-zubo-accent-500" hex="#AAB89B" usage="Success/positive, focus rings" />
          <Swatch
            name="Text / Neutral"
            className="bg-zubo-text-700"
            hex="#2D2D2D"
            usage="Body text, titles, navigation"
          />
        </section>

        {/* Buttons usage */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-zubo-text">Buttons</CardTitle>
              <CardDescription className="text-zubo-text">
                Primary drives action; keep Coral/Bronze for light accents to preserve hierarchy.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {/* Primary (Midnight Blue) */}
              <Button className="bg-zubo-primary-500 hover:bg-[#1F2A3A] text-white focus-visible:ring-2 focus-visible:ring-zubo-accent-500">
                Book Now
              </Button>
              {/* Quiet / Outline with Bronze hover */}
              <Button
                className="border-zubo-primary-500 text-zubo-primary hover:bg-zubo-highlight-2-50 bg-transparent"
                variant="outline"
              >
                Learn More
              </Button>
              {/* Accent Action (Moss) */}
              <Button className="bg-zubo-accent-600 hover:bg-zubo-accent-700 text-white">Confirm</Button>
              {/* Coral as chip / light emphasis, dark text for contrast */}
              <Button className="bg-zubo-highlight-1-100 text-zubo-text-700 hover:bg-zubo-highlight-1-200 border border-zubo-highlight-1-300">
                <HeartHandshake className="mr-1" />
                Care Options
              </Button>
            </CardContent>
          </Card>

          {/* Cards and surfaces */}
          <Card>
            <CardHeader>
              <CardTitle className="text-zubo-text">Surfaces</CardTitle>
              <CardDescription className="text-zubo-text">
                Use Background for page base and white for cards. Add subtle Bronze borders for warmth.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-zubo-highlight-2-100 bg-white p-4">
                <p className="font-medium text-zubo-text">Standard Card</p>
                <p className="text-sm text-gray-600">White surface, warm thin border (#B8835C/10).</p>
              </div>
              <div className="rounded-lg border border-zubo-accent-200 bg-zubo-background-200 p-4">
                <p className="font-medium text-zubo-text">Muted Section</p>
                <p className="text-sm text-gray-600">Use background tint for breathing room between sections.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Banners / Callouts */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-zubo-text">Warm Promo Banner</CardTitle>
              <CardDescription className="text-zubo-text">
                Coral background with dark text and defined border for accessibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-zubo-highlight-1-300 bg-zubo-highlight-1-100 p-4">
                <div className="flex items-start gap-3">
                  <PawPrint className="mt-0.5 text-zubo-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-zubo-text">New Zubo Walkers video intros</p>
                    <p className="text-sm text-zubo-text/80">
                      We{"'"}re rolling out short intro videos on Zubo Walkers profiles.
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="inline-flex items-center text-sm font-medium text-zubo-primary hover:underline"
                  >
                    Preview <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-zubo-text">Success / Positive</CardTitle>
              <CardDescription className="text-zubo-text">
                Use Moss Green as the positive/confirmation color and for focus rings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-zubo-accent-300 bg-zubo-accent-50 p-3">
                <BadgeCheck className="text-zubo-accent-700" />
                <p className="text-sm text-zubo-text">Payment verified and Zubo Walkers confirmed.</p>
              </div>
              <Button className="bg-zubo-accent-600 hover:bg-zubo-accent-700 text-white focus-visible:ring-2 focus-visible:ring-zubo-accent-500">
                Proceed
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Links, dividers, hovers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-zubo-text">Links, Dividers, and Hovers</CardTitle>
            <CardDescription className="text-zubo-text">
              Primary-colored links; Bronze for subtle dividers and hover accents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <Link href="#" className="text-zubo-primary hover:underline">
                Primary Link
              </Link>
              <Link href="#" className="text-zubo-text hover:text-zubo-primary">
                Quiet Link
              </Link>
              <button className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-zubo-text hover:border-zubo-highlight-2-300 hover:bg-zubo-highlight-2-50">
                Bronze Hover <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Separator className="bg-zubo-highlight-2-200" />
            <p className="text-sm text-gray-600">
              Use Bronze Clay tints for borders and separators to add warmth without stealing focus.
            </p>
          </CardContent>
        </Card>

        {/* Sitter video preview pattern (for future bio page) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-zubo-text">Zubo Walkers Video Preview Pattern</CardTitle>
            <CardDescription className="text-zubo-text">
              Suggestion for the Zubo Walkers bio page: Midnight Blue controls, Coral chip, Moss focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 md:flex-row md:items-center">
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-zubo-highlight-2-100 bg-zubo-background-200 md:w-64">
              <div className="absolute inset-0 grid place-content-center text-zubo-primary">
                <Play className="h-10 w-10 opacity-80" />
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-zubo-highlight-1-300 bg-zubo-highlight-1-100 px-3 py-1 text-xs font-medium text-zubo-text-700">
                Intro video
              </div>
              <p className="mb-3 text-sm text-gray-700">
                Use dark text on Coral chips, Primary buttons, and Moss focus rings for accessibility.
              </p>
              <div className="flex gap-2">
                <Button className="bg-zubo-primary-500 hover:bg-[#1F2A3A] text-white">Play video</Button>
                <Button
                  variant="outline"
                  className="border-zubo-primary-500 text-zubo-primary hover:bg-zubo-background-200 bg-transparent"
                >
                  Message Zubo Walkers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
