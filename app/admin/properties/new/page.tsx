import { createPropertyAction } from "@/app/admin/properties/actions";

export default function NewPropertyPage() {
  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Add property</h1>
      <form action={createPropertyAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <input
            id="address"
            name="address"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-sm font-medium">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="rentAmount" className="text-sm font-medium">
            Monthly rent ($)
          </label>
          <input
            id="rentAmount"
            name="rentAmount"
            type="number"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-2 rounded bg-black px-4 py-2 text-white">
          Add property
        </button>
      </form>
    </div>
  );
}