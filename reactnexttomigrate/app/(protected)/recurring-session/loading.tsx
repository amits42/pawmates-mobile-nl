export default function LoadingRecurringSession() {
  return (
    <div className="min-h-screen bg-zubo-background-300">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <svg className="h-8 w-8 mx-auto mb-4 animate-spin text-zubo-primary-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <h3 className="text-lg font-semibold text-zubo-text-800 mb-2">{"Loading session details"}</h3>
            <p className="text-sm text-zubo-text-600">{"Please wait..."}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
