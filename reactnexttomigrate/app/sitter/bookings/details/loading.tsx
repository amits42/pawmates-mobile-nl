export default function Loading() {
  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 bg-zubo-background-100">
      <div className="h-8 w-40 bg-zubo-background-200 rounded" />
      <div className="shadow-md rounded-xl border border-zubo-background-200 bg-zubo-background-50 p-4">
        <div className="space-y-3">
          <div className="h-4 bg-zubo-background-200 rounded w-1/3" />
          <div className="h-24 bg-zubo-background-200 rounded" />
          <div className="h-4 bg-zubo-background-200 rounded w-1/4" />
          <div className="h-20 bg-zubo-background-200 rounded" />
        </div>
      </div>
    </div>
  )
}
