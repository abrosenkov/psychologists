// export async function generateMetadata({
//   params,
// }: CamperDetailsPageProps): Promise<Metadata> {
//   const { id } = await params;

//   try {
//     const camper = await getCamperById(id);

//     if (!camper) {
//       return {
//         title: "Camper Not Found | TravelTrucks",
//       };
//     }

//     const title = `${camper.name} | TravelTrucks`;
//     const description = camper.description
//       ? camper.description.slice(0, 160)
//       : "Book this amazing campervan for your next trip.";

//     return {
//       title,
//       description,
//       alternates: {
//         canonical: `${BASE_URL}/catalog/${id}`,
//       },
//       openGraph: {
//         title,
//         description,
//         type: "website",
//         url: `${BASE_URL}/catalog/${id}`,
//         images: [
//           {
//             url:
//               camper.gallery?.[0]?.original || camper.gallery?.[0]?.thumb || "",
//             width: 1200,
//             height: 630,
//             alt: camper.name,
//           },
//         ],
//       },
//     };
//   } catch {
//     return {
//       title: "Camper Details | TravelTrucks",
//     };
//   }
// }

export default async function PsychologistDetailsPage() {
  return <div>PsychologistDetailsPage</div>;
}
