require("dotenv").config();

const connectDB = require("../config/db.js");
const Country = require("../models/Country.js");
const VisaCategory = require("../models/VisaCategory.js");
const ServicePackage = require("../models/ServicePackage.js");
const User = require("../models/User.js");
const Lead = require("../models/Lead.js");
const Applicant = require("../models/Applicant.js");
const Case = require("../models/Case.js");
const Appointment = require("../models/Appointment.js");
const Invoice = require("../models/Invoice.js");
const ChecklistTemplate = require("../models/ChecklistTemplate.js");
const CommunicationTemplate = require("../models/CommunicationTemplate.js");
const CountryProcessUpdate = require("../models/CountryProcessUpdate.js");
const Setting = require("../models/Setting.js");
const { CASE_STATUSES, LEAD_STAGES } = require("../utils/visaassist.constants.js");
const { visaCategoriesSeed, servicePackagesSeed } = require("./visaassist.data.js");

const upsertCountry = async (input) => {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return Country.findOneAndUpdate(
    { code: input.code },
    {
      $set: {
        name: input.name,
        slug,
        region: input.region || "",
        description: input.description || "",
        ranking: input.ranking || 0,
        isFeatured: Boolean(input.isFeatured),
      },
    },
    { new: true, upsert: true }
  );
};

const upsertStaffUser = async (input) => {
  const existing = await User.findOne({ email: input.email.toLowerCase() }).select("+password");
  if (!existing) {
    return User.create({
      ...input,
      email: input.email.toLowerCase(),
    });
  }

  existing.firstName = input.firstName;
  existing.lastName = input.lastName;
  existing.role = input.role;
  existing.phone = input.phone;
  existing.country = input.country;
  existing.isActive = true;
  await existing.save();

  return existing;
};

const runVisaAssistSeed = async () => {
  await connectDB();

  const seededCountries = await Promise.all([
    upsertCountry({ name: "Canada", code: "CA", region: "North America", ranking: 10, isFeatured: true }),
    upsertCountry({ name: "Australia", code: "AU", region: "Oceania", ranking: 9, isFeatured: true }),
    upsertCountry({ name: "United Kingdom", code: "GB", region: "Europe", ranking: 8, isFeatured: true }),
    upsertCountry({ name: "United States", code: "US", region: "North America", ranking: 8, isFeatured: true }),
  ]);

  await VisaCategory.deleteMany({});
  const categories = await VisaCategory.insertMany(visaCategoriesSeed);

  await ServicePackage.deleteMany({});
  const packages = await ServicePackage.insertMany(
    servicePackagesSeed.map((pkg) => ({
      ...pkg,
      visaCategory: categories[0]._id,
    }))
  );

  const staff = await Promise.all([
    upsertStaffUser({
      firstName: "Maya",
      lastName: "Sharma",
      email: "superadmin@visaassist.org",
      phone: "+1-604-555-0181",
      password: "Admin@1234",
      role: "super_admin",
      country: "Canada",
    }),
    upsertStaffUser({
      firstName: "Rohan",
      lastName: "Kapoor",
      email: "docs.exec@visaassist.org",
      phone: "+91-99880-33112",
      password: "Admin@1234",
      role: "documentation_executive",
      country: "India",
    }),
    upsertStaffUser({
      firstName: "Emily",
      lastName: "Clark",
      email: "support.exec@visaassist.org",
      phone: "+44-20-7946-0103",
      password: "Admin@1234",
      role: "support_executive",
      country: "United Kingdom",
    }),
    upsertStaffUser({
      firstName: "Lucas",
      lastName: "Miller",
      email: "destination.specialist@visaassist.org",
      phone: "+61-2-7200-4455",
      password: "Admin@1234",
      role: "destination_specialist",
      country: "Australia",
    }),
    upsertStaffUser({
      firstName: "Rhea",
      lastName: "Das",
      email: "adviser@visaassist.org",
      phone: "+91-90000-11122",
      password: "Admin@1234",
      role: "adviser",
      country: "India",
    }),
    upsertStaffUser({
      firstName: "Kabir",
      lastName: "Sethi",
      email: "support@visaassist.org",
      phone: "+91-90000-33344",
      password: "Admin@1234",
      role: "support",
      country: "India",
    }),
  ]);

  const [superAdmin, docsExec, supportExec, destinationSpecialist] = staff;

  await Promise.all([
    Appointment.deleteMany({}),
    Invoice.deleteMany({}),
    Case.deleteMany({}),
    Applicant.deleteMany({}),
    Lead.deleteMany({}),
  ]);

  const leads = await Lead.insertMany([
    {
      fullName: "Aarav Mehta",
      email: "aarav.mehta@example.com",
      phone: "+91-9820001122",
      countryCode: "+91",
      nationality: "Indian",
      destinationCountry: "Canada",
      visaCategory: "Student Visa",
      travelPurpose: "Masters in Data Analytics",
      urgency: "high",
      priorRefusal: false,
      notes: "Requires September intake counseling.",
      source: "website",
      stage: "qualified",
      assignedTo: docsExec._id,
    },
    {
      fullName: "Nisha Verma",
      email: "nisha.verma@example.com",
      phone: "+91-9811102233",
      countryCode: "+91",
      nationality: "Indian",
      destinationCountry: "Australia",
      visaCategory: "Work Visa",
      travelPurpose: "Skilled migration pathway",
      urgency: "medium",
      priorRefusal: true,
      notes: "Previous refusal in 2022 due to weak employment proof.",
      source: "referral",
      stage: "contacted",
      assignedTo: supportExec._id,
    },
    {
      fullName: "Samuel Reed",
      email: "samuel.reed@example.com",
      phone: "+1-202-555-0119",
      countryCode: "+1",
      nationality: "American",
      destinationCountry: "United Kingdom",
      visaCategory: "Work Visa",
      travelPurpose: "Inter-company transfer",
      urgency: "normal",
      priorRefusal: false,
      source: "linkedin",
      stage: "new",
      assignedTo: destinationSpecialist._id,
    },
    {
      fullName: "Fatima Noor",
      email: "fatima.noor@example.com",
      phone: "+971-50-440-9921",
      countryCode: "+971",
      nationality: "Pakistani",
      destinationCountry: "Canada",
      visaCategory: "Tourist Visa",
      travelPurpose: "Family visit",
      urgency: "normal",
      priorRefusal: false,
      source: "instagram",
      stage: "qualified",
      assignedTo: superAdmin._id,
    },
    {
      fullName: "Victor Ndlovu",
      email: "victor.ndlovu@example.com",
      phone: "+27-11-555-0176",
      countryCode: "+27",
      nationality: "South African",
      destinationCountry: "Australia",
      visaCategory: "Student Visa",
      travelPurpose: "Diploma in Business",
      urgency: "medium",
      priorRefusal: false,
      source: "website",
      stage: "new",
      assignedTo: docsExec._id,
    },
    {
      fullName: "Julia Chen",
      email: "julia.chen@example.com",
      phone: "+1-415-555-0163",
      countryCode: "+1",
      nationality: "Chinese",
      destinationCountry: "United States",
      visaCategory: "Tourist Visa",
      travelPurpose: "Conference attendance",
      urgency: "low",
      priorRefusal: false,
      source: "newsletter",
      stage: "lost",
      assignedTo: supportExec._id,
      notes: "Paused plan due to schedule change.",
    },
  ]);

  const applicants = await Applicant.insertMany([
    {
      leadId: leads[0]._id,
      fullName: "Aarav Mehta",
      email: "aarav.mehta@applicant.example.com",
      phone: "+91-9820001122",
      countryCode: "+91",
      nationality: "Indian",
      passport: {
        passportNumber: "P9988776",
        issueCountry: "India",
      },
      basicProfile: {
        occupation: "Software Engineer",
        maritalStatus: "single",
        currentAddress: "Pune, India",
      },
      travelProfile: {
        previousTravelCountries: ["Singapore", "Thailand"],
        priorRefusal: false,
      },
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      disclaimerAccepted: true,
      disclaimerAcceptedAt: new Date(),
      refundPolicyAccepted: true,
      refundPolicyAcceptedAt: new Date(),
      createdBy: docsExec._id,
    },
    {
      leadId: leads[3]._id,
      fullName: "Fatima Noor",
      email: "fatima.noor@applicant.example.com",
      phone: "+971-50-440-9921",
      countryCode: "+971",
      nationality: "Pakistani",
      passport: {
        passportNumber: "L3344558",
        issueCountry: "Pakistan",
      },
      basicProfile: {
        occupation: "Marketing Manager",
        maritalStatus: "married",
        currentAddress: "Dubai, UAE",
      },
      travelProfile: {
        previousTravelCountries: ["Turkey", "Malaysia"],
        priorRefusal: false,
      },
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      disclaimerAccepted: true,
      disclaimerAcceptedAt: new Date(),
      refundPolicyAccepted: true,
      refundPolicyAcceptedAt: new Date(),
      createdBy: superAdmin._id,
    },
    {
      fullName: "Mariam Ali",
      email: "mariam.ali@applicant.example.com",
      phone: "+20-10-1000-2200",
      countryCode: "+20",
      nationality: "Egyptian",
      passport: {
        passportNumber: "E6655443",
        issueCountry: "Egypt",
      },
      basicProfile: {
        occupation: "Architect",
        maritalStatus: "single",
        currentAddress: "Cairo, Egypt",
      },
      travelProfile: {
        previousTravelCountries: ["UAE"],
        priorRefusal: false,
      },
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      disclaimerAccepted: false,
      refundPolicyAccepted: false,
      createdBy: supportExec._id,
    },
    {
      leadId: leads[1]._id,
      fullName: "Nisha Verma",
      email: "nisha.verma@applicant.example.com",
      phone: "+91-9811102233",
      countryCode: "+91",
      nationality: "Indian",
      passport: {
        passportNumber: "K1122334",
        issueCountry: "India",
      },
      basicProfile: {
        occupation: "HR Specialist",
        maritalStatus: "married",
        currentAddress: "Bengaluru, India",
      },
      travelProfile: {
        previousTravelCountries: ["UAE", "Qatar"],
        priorRefusal: true,
        refusalDetails: "Insufficient supporting employment evidence in prior filing.",
      },
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      disclaimerAccepted: true,
      disclaimerAcceptedAt: new Date(),
      refundPolicyAccepted: true,
      refundPolicyAcceptedAt: new Date(),
      createdBy: supportExec._id,
    },
  ]);

  const cases = await Case.insertMany([
    {
      caseId: "VA-CASE-2026-0001",
      applicantId: applicants[0]._id,
      leadId: leads[0]._id,
      destinationCountry: "Canada",
      visaCategory: "Student Visa",
      packageId: packages[0]._id,
      assignedStaff: [docsExec._id, superAdmin._id],
      priority: "high",
      caseStatus: "documents_pending",
      timeline: [
        {
          status: "inquiry_received",
          note: "Case created from converted lead",
          changedBy: docsExec._id,
        },
        {
          status: "documents_pending",
          note: "Requested financial and education documents",
          changedBy: docsExec._id,
        },
      ],
      internalNotes: [
        {
          message: "Check GIC timeline and tuition payment proof.",
          createdBy: docsExec._id,
        },
      ],
    },
    {
      caseId: "VA-CASE-2026-0002",
      applicantId: applicants[1]._id,
      leadId: leads[3]._id,
      destinationCountry: "Canada",
      visaCategory: "Tourist Visa",
      packageId: packages[0]._id,
      assignedStaff: [supportExec._id],
      priority: "medium",
      caseStatus: "appointment_pending",
      timeline: [
        {
          status: "inquiry_received",
          note: "Travel history and purpose validated",
          changedBy: supportExec._id,
        },
        {
          status: "appointment_pending",
          note: "Biometrics appointment awaited",
          changedBy: supportExec._id,
        },
      ],
      customerNotes: [
        {
          message: "Please carry passport originals and travel itinerary printouts.",
          createdBy: supportExec._id,
        },
      ],
    },
    {
      caseId: "VA-CASE-2026-0003",
      applicantId: applicants[3]._id,
      leadId: leads[1]._id,
      destinationCountry: "Australia",
      visaCategory: "Work Visa",
      packageId: packages[0]._id,
      assignedStaff: [destinationSpecialist._id, supportExec._id],
      priority: "critical",
      caseStatus: "review_in_progress",
      timeline: [
        {
          status: "screening_pending",
          note: "Re-evaluating previous refusal",
          changedBy: destinationSpecialist._id,
        },
        {
          status: "review_in_progress",
          note: "Collecting stronger work profile and employer letters",
          changedBy: destinationSpecialist._id,
        },
      ],
      internalNotes: [
        {
          message: "Prepare refusal-response narrative and updated employment letter.",
          createdBy: destinationSpecialist._id,
        },
      ],
    },
  ]);

  await Lead.findByIdAndUpdate(leads[0]._id, {
    $set: { stage: "converted", convertedApplicantId: applicants[0]._id, convertedCaseId: cases[0]._id },
  });
  await Lead.findByIdAndUpdate(leads[3]._id, {
    $set: { stage: "converted", convertedApplicantId: applicants[1]._id, convertedCaseId: cases[1]._id },
  });
  await Lead.findByIdAndUpdate(leads[1]._id, {
    $set: { stage: "converted", convertedApplicantId: applicants[3]._id, convertedCaseId: cases[2]._id },
  });

  await Appointment.insertMany([
    {
      caseId: cases[1]._id,
      applicantId: applicants[1]._id,
      appointmentType: "biometrics",
      appointmentDate: new Date("2026-02-18T10:30:00.000Z"),
      appointmentTime: "10:30 AM",
      center: "VFS Global - Dubai",
      reference: "BIO-DXB-24021",
      bookingStatus: "confirmed",
      remarks: "Carry two photographs and stamped appointment sheet.",
    },
    {
      caseId: cases[0]._id,
      applicantId: applicants[0]._id,
      appointmentType: "submission",
      appointmentDate: new Date("2026-03-05T09:00:00.000Z"),
      appointmentTime: "09:00 AM",
      center: "Canada Visa Application Centre - New Delhi",
      reference: "SUB-ND-51077",
      bookingStatus: "pending",
      remarks: "Awaiting final document QC.",
    },
  ]);

  await Invoice.insertMany([
    {
      invoiceNumber: "VA-INV-2026-0001",
      caseId: cases[0]._id,
      applicantId: applicants[0]._id,
      leadId: leads[0]._id,
      packageId: packages[0]._id,
      lineItems: [
        { description: "Starter Documentation Pack", quantity: 1, unitPrice: 399, taxPercent: 0, amount: 399 },
        { description: "Priority Review Add-on", quantity: 1, unitPrice: 120, taxPercent: 0, amount: 120 },
      ],
      currency: "USD",
      subTotal: 519,
      taxTotal: 0,
      totalAmount: 519,
      paidAmount: 300,
      balanceDue: 219,
      paymentStatus: "partial",
      engagementTerms: "Payment split into two milestones.",
      generatedBy: docsExec._id,
    },
    {
      invoiceNumber: "VA-INV-2026-0002",
      caseId: cases[1]._id,
      applicantId: applicants[1]._id,
      leadId: leads[3]._id,
      packageId: packages[0]._id,
      lineItems: [
        { description: "Tourist Visa Processing", quantity: 1, unitPrice: 399, taxPercent: 0, amount: 399 },
      ],
      currency: "USD",
      subTotal: 399,
      taxTotal: 0,
      totalAmount: 399,
      paidAmount: 399,
      balanceDue: 0,
      paymentStatus: "paid",
      engagementTerms: "Paid in full before submission.",
      generatedBy: supportExec._id,
    },
    {
      invoiceNumber: "VA-INV-2026-0003",
      caseId: cases[2]._id,
      applicantId: applicants[3]._id,
      leadId: leads[1]._id,
      packageId: packages[0]._id,
      lineItems: [
        { description: "Work Visa Case Rebuild", quantity: 1, unitPrice: 599, taxPercent: 0, amount: 599 },
      ],
      currency: "USD",
      subTotal: 599,
      taxTotal: 0,
      totalAmount: 599,
      paidAmount: 0,
      balanceDue: 599,
      paymentStatus: "pending",
      engagementTerms: "Invoice issued after refusal reassessment session.",
      generatedBy: destinationSpecialist._id,
    },
  ]);

  await ChecklistTemplate.deleteMany({});
  await ChecklistTemplate.insertMany([
    {
      name: "Canada Study Basic Checklist",
      destinationCountry: "Canada",
      visaCategory: categories[1]?._id || categories[0]._id,
      visaTypeSlug: "study",
      version: 1,
      isActiveVersion: true,
      isActive: true,
      status: "active",
      items: [
        { key: "passport", label: "Passport", required: true, documentCategory: "passport", sortOrder: 1 },
        { key: "funds", label: "Proof of Funds", required: true, documentCategory: "bank_statement", sortOrder: 2 },
      ],
      changeLog: [{ summary: "Initial template", changedBy: docsExec._id }],
    },
  ]);

  await CommunicationTemplate.deleteMany({});
  await CommunicationTemplate.insertMany([
    {
      key: "email-doc-reminder",
      name: "Document Reminder",
      type: "email",
      channel: "email",
      subject: "Pending documents for {{fullName}}",
      body: "Hello {{fullName}}, please upload pending documents.",
      variables: ["fullName"],
      isActive: true,
      createdBy: superAdmin._id,
    },
  ]);

  await CountryProcessUpdate.deleteMany({});
  await CountryProcessUpdate.insertMany([
    {
      destinationCountry: "Canada",
      visaCategory: "Study",
      title: "Biometrics processing update",
      summary: "Average processing timeline revised",
      content: "Biometrics slots are now available in 2 to 3 weeks.",
      advisory: "Biometrics slots are now available in 2 to 3 weeks.",
      effectiveDate: new Date(),
      sourceUrl: "https://www.canada.ca",
      status: "published",
      publishedBy: destinationSpecialist._id,
      version: 1,
      isActiveVersion: true,
    },
  ]);

  await Setting.deleteMany({});
  await Setting.insertMany([
    { key: "system.defaultCurrency", value: "INR", group: "system" },
    { key: "features.enablePayments", value: true, group: "features" },
  ]);

  console.log("Visaassist seed complete.");
  console.log(`Countries upserted: ${seededCountries.length}`);
  console.log(`Visa categories inserted: ${categories.length}`);
  console.log(`Service packages inserted: ${packages.length}`);
  console.log(`Staff accounts ready: ${staff.length}`);
  console.log(`Leads inserted: ${leads.length}`);
  console.log(`Applicants inserted: ${applicants.length}`);
  console.log(`Cases inserted: ${cases.length}`);
  console.log(`Lead stages available: ${LEAD_STAGES.join(", ")}`);
  console.log(`Case statuses available: ${CASE_STATUSES.join(", ")}`);

  process.exit(0);
};

runVisaAssistSeed().catch((error) => {
  console.error("Visaassist seed failed", error);
  process.exit(1);
});
