import { getDoctors, getDoctorReviews } from "./doctorService";

function normalizeList(response) {
  const data = response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

export async function getAdminReviews() {
  const doctorResponse = await getDoctors();
  const doctors = normalizeList(doctorResponse);

  const settled = await Promise.allSettled(
    doctors.map(async (doctor) => {
      const reviewResponse = await getDoctorReviews(doctor.id);
      const reviews = normalizeList(reviewResponse);
      return reviews.map((review) => ({
        ...review,
        doctorId: doctor.id,
        doctorName: doctor.fullName ?? review.doctorName ?? "--",
        doctorSpecialty: doctor.specialtyName ?? "--",
        doctorEmail: doctor.email ?? "",
      }));
    })
  );

  const reviewList = settled
    .filter((item) => item.status === "fulfilled")
    .flatMap((item) => item.value);

  reviewList.sort((a, b) => {
    const dateA = new Date(a.createdAt ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? 0).getTime();
    return dateB - dateA;
  });

  return {
    doctors,
    reviews: reviewList,
    failedDoctorCount: settled.filter((item) => item.status === "rejected").length,
  };
}
