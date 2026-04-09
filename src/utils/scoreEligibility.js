const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const scoreEligibility = ({
	age,
	educationLevel,
	yearsOfExperience,
	englishScore,
	hasJobOffer,
	hasFunds,
	destination,
}) => {
	const agePoints = age >= 25 && age <= 35 ? 20 : age >= 18 && age <= 45 ? 12 : 5;
	const educationMap = {
		phd: 20,
		masters: 18,
		bachelors: 14,
		diploma: 10,
		highschool: 6,
	};
	const educationPoints = educationMap[(educationLevel || "").toLowerCase()] || 0;
	const experiencePoints = clamp((yearsOfExperience || 0) * 2, 0, 20);
	const languagePoints = clamp((englishScore || 0) * 2, 0, 20);
	const offerPoints = hasJobOffer ? 10 : 0;
	const fundsPoints = hasFunds ? 10 : 0;
	const destinationPoints = destination ? 5 : 0;

	const total =
		agePoints +
		educationPoints +
		experiencePoints +
		languagePoints +
		offerPoints +
		fundsPoints +
		destinationPoints;

	const normalized = clamp(Math.round((total / 105) * 100), 0, 100);

	const recommendation =
		normalized >= 75
			? "High eligibility. Proceed to detailed consultation."
			: normalized >= 50
			? "Moderate eligibility. Improve profile and re-assess."
			: "Low eligibility currently. Advisor guidance recommended.";

	return {
		score: normalized,
		recommendation,
		breakdown: {
			agePoints,
			educationPoints,
			experiencePoints,
			languagePoints,
			offerPoints,
			fundsPoints,
			destinationPoints,
		},
	};
};
module.exports = { scoreEligibility };
