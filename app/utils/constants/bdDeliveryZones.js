export const DEFAULT_DELIVERY_CHARGE = 110;
export const DHAKA_DELIVERY_CHARGE = 90;

const DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapai Nawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

const SHARED_AREAS = ["Sadar", "Bazar", "Station Road", "College Road", "Court Area"];

const SPECIAL_ZONES = {
  Dhaka: {
    cities: ["Dhaka", "Narayanganj", "Savar", "Keraniganj", "Dhamrai"],
    areasByCity: {
      Dhaka: [
        "Gulshan",
        "Banani",
        "Dhanmondi",
        "Uttara",
        "Mirpur",
        "Mohammadpur",
        "Badda",
        "Rampura",
        "Old Dhaka",
      ],
      Narayanganj: ["Bandar", "Fatullah", "Siddhirganj", "Narayanganj Sadar"],
      Savar: ["Savar Bazar", "Hemayetpur", "Ashulia", "Nabinagar"],
      Keraniganj: ["South Keraniganj", "Chunkutia", "Rohitpur"],
      Dhamrai: ["Dhamrai Bazar", "Kulla", "Nannar"],
    },
  },
  Chattogram: {
    cities: ["Chattogram", "Patiya", "Sitakunda", "Hathazari"],
    areasByCity: {
      Chattogram: ["Agrabad", "GEC", "Pahartali", "Nasirabad", "EPZ", "Halishahar"],
      Patiya: ["Patiya Sadar", "Kusumpura", "Shikalbaha"],
      Sitakunda: ["Sitakunda Bazar", "Barabkunda", "Bhatiary"],
      Hathazari: ["Hathazari Sadar", "Mirzapur", "Fatikchhari Road"],
    },
  },
  Narayanganj: {
    cities: ["Narayanganj", "Bandar", "Araihazar", "Rupganj", "Sonargaon"],
    areasByCity: {
      Narayanganj: ["Chashara", "Fatullah", "Siddhirganj", "Khanpur"],
      Bandar: ["Bandar Bazar", "Madanpur", "Nabiganj"],
      Araihazar: ["Araihazar Sadar", "Kalapaharia", "Duptara"],
      Rupganj: ["Rupganj", "Tarabo", "Bhulta"],
      Sonargaon: ["Mograpara", "Panam", "Kanchpur"],
    },
  },
  Gazipur: {
    cities: ["Gazipur", "Tongi", "Sreepur", "Kaliakair"],
    areasByCity: {
      Gazipur: ["Board Bazar", "Shibbari", "Shapla Chattar"],
      Tongi: ["Tongi Bazar", "College Gate", "Station Road"],
      Sreepur: ["Sreepur Bazar", "Barmi", "Maona"],
      Kaliakair: ["Chandra", "Kaliakair Sadar", "Safipur"],
    },
  },
  Sylhet: {
    cities: ["Sylhet", "Beanibazar", "Golapganj", "Fenchuganj"],
    areasByCity: {
      Sylhet: ["Zindabazar", "Amberkhana", "Upashahar", "Shibgonj"],
      Beanibazar: ["Beanibazar Sadar", "Mathiura", "Sheola"],
      Golapganj: ["Golapganj Sadar", "Dhakadakshin", "Lakshanaband"],
      Fenchuganj: ["Fenchuganj Sadar", "Maijgaon", "Kushiyara"],
    },
  },
};

export const STEADFAST_DELIVERY_ZONES = DISTRICTS.map((district) => {
  const zone = SPECIAL_ZONES[district];
  if (zone) return { district, cities: zone.cities, areasByCity: zone.areasByCity };

  const city = `${district} Sadar`;
  return {
    district,
    cities: [city],
    areasByCity: { [city]: SHARED_AREAS },
  };
});

const normalize = (value) => String(value || "").trim().toLowerCase();

export const isDhakaDistrict = (district) => {
  const value = normalize(district);
  return value === "dhaka" || value.includes("dhaka") || value.includes("ঢাকা");
};

export const calculateDeliveryCharge = ({ district = "", hasFreeDelivery = false } = {}) => {
  if (hasFreeDelivery) return 0;
  return isDhakaDistrict(district) ? DHAKA_DELIVERY_CHARGE : DEFAULT_DELIVERY_CHARGE;
};

export const getDistrictOptions = () => STEADFAST_DELIVERY_ZONES.map((entry) => entry.district);

export const getCitiesByDistrict = (district) => {
  const found = STEADFAST_DELIVERY_ZONES.find(
    (entry) => normalize(entry.district) === normalize(district)
  );
  return found?.cities || [];
};

export const getAreasByDistrictAndCity = (district, city) => {
  const found = STEADFAST_DELIVERY_ZONES.find(
    (entry) => normalize(entry.district) === normalize(district)
  );
  if (!found) return [];
  const matchedCity = (found.cities || []).find((entry) => normalize(entry) === normalize(city));
  if (!matchedCity) return [];
  return found.areasByCity?.[matchedCity] || [];
};
