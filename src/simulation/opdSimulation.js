const AllocationEngine = require("../engine/AllocationEngine");
const TokenStore = require("../stores/TokenStore");
const SlotStore = require("../stores/SlotStore");
const Slot = require("../models/Slot");
const { TOKEN_TYPES, TOKEN_STATES } = require("../constants");

class OPDSimulation {
  constructor() {
    this.tokenStore = new TokenStore();
    this.slotStore = new SlotStore();
    this.engine = new AllocationEngine(this.tokenStore, this.slotStore);
    this.simulationDate = "2025-01-30";
  }

  log(message, data = null) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log("=".repeat(80));
  }

  async setupDoctorsAndSlots() {
    this.log("STEP 1: Setting up 3 Doctors with their time slots");

    const doctors = [
      {
        id: "DOC001",
        name: "Dr. Sharma (Cardiologist)",
        slots: [
          { start: "09:00", end: "10:00", capacity: 4 },
          { start: "10:00", end: "11:00", capacity: 4 },
          { start: "11:00", end: "12:00", capacity: 4 },
        ],
      },
      {
        id: "DOC002",
        name: "Dr. Patel (Orthopedic)",
        slots: [
          { start: "09:00", end: "10:00", capacity: 5 },
          { start: "10:00", end: "11:00", capacity: 5 },
          { start: "14:00", end: "15:00", capacity: 5 },
        ],
      },
      {
        id: "DOC003",
        name: "Dr. Kumar (General Physician)",
        slots: [
          { start: "09:00", end: "10:00", capacity: 6 },
          { start: "10:00", end: "11:00", capacity: 6 },
          { start: "11:00", end: "12:00", capacity: 6 },
          { start: "14:00", end: "15:00", capacity: 6 },
        ],
      },
    ];

    const createdSlots = [];

    doctors.forEach((doctor) => {
      doctor.slots.forEach((slotData) => {
        const slot = new Slot({
          doctorId: doctor.id,
          doctorName: doctor.name,
          startTime: slotData.start,
          endTime: slotData.end,
          maxCapacity: slotData.capacity,
          date: this.simulationDate,
        });
        this.slotStore.addSlot(slot);
        createdSlots.push({
          doctor: doctor.name,
          time: `${slotData.start}-${slotData.end}`,
          capacity: slotData.capacity,
        });
      });
    });

    console.log("\nCreated slots:");
    console.table(createdSlots);

    return doctors;
  }

  async simulateOnlineBookings(doctors) {
    this.log("STEP 2: Processing Online Bookings (Previous night bookings)");

    const bookings = [
      {
        doctor: "DOC001",
        patient: "Rahul Verma",
        id: "P001",
        phone: "9876543210",
      },
      {
        doctor: "DOC001",
        patient: "Priya Singh",
        id: "P002",
        phone: "9876543211",
      },
      {
        doctor: "DOC002",
        patient: "Amit Kumar",
        id: "P003",
        phone: "9876543212",
      },
      {
        doctor: "DOC002",
        patient: "Sneha Reddy",
        id: "P004",
        phone: "9876543213",
      },
      {
        doctor: "DOC003",
        patient: "Vikram Joshi",
        id: "P005",
        phone: "9876543214",
      },
      {
        doctor: "DOC003",
        patient: "Anita Desai",
        id: "P006",
        phone: "9876543215",
      },
      {
        doctor: "DOC003",
        patient: "Rajesh Khanna",
        id: "P007",
        phone: "9876543216",
      },
    ];

    const results = [];

    bookings.forEach((booking) => {
      try {
        const result = this.engine.allocateToken({
          doctorId: booking.doctor,
          patientId: booking.patient,
          patientName: booking.patient,
          tokenType: TOKEN_TYPES.ONLINE_BOOKING,
          phoneNumber: booking.phone,
          date: this.simulationDate,
        });
        results.push({
          patient: booking.patient,
          tokenNumber: result.token.tokenNumber,
          time: result.token.estimatedTime,
          slot: `${result.slot.startTime}-${result.slot.endTime}`,
        });
      } catch (error) {
        console.log(`Failed to book for ${booking.patient}: ${error.message}`);
      }
    });

    console.log("\nOnline bookings confirmed:");
    console.table(results);
  }

  async simulateWalkIns() {
    this.log("STEP 3: Morning Walk-ins (9:00 AM - 9:30 AM)");

    const walkIns = [
      {
        doctor: "DOC001",
        patient: "Suresh Nair",
        id: "P008",
        phone: "9876543217",
      },
      {
        doctor: "DOC002",
        patient: "Lakshmi Iyer",
        id: "P009",
        phone: "9876543218",
      },
      {
        doctor: "DOC003",
        patient: "Mohan Das",
        id: "P010",
        phone: "9876543219",
      },
      {
        doctor: "DOC003",
        patient: "Kavita Sharma",
        id: "P011",
        phone: "9876543220",
      },
      {
        doctor: "DOC001",
        patient: "Deepak Mehta",
        id: "P012",
        phone: "9876543221",
      },
    ];

    const results = [];

    walkIns.forEach((walkIn) => {
      try {
        const result = this.engine.allocateToken({
          doctorId: walkIn.doctor,
          patientId: walkIn.id,
          patientName: walkIn.patient,
          tokenType: TOKEN_TYPES.WALK_IN,
          phoneNumber: walkIn.phone,
          date: this.simulationDate,
        });
        results.push({
          patient: walkIn.patient,
          tokenNumber: result.token.tokenNumber,
          time: result.token.estimatedTime,
          slot: `${result.slot.startTime}-${result.slot.endTime}`,
        });
      } catch (error) {
        console.log(`Failed walk-in for ${walkIn.patient}: ${error.message}`);
      }
    });

    console.log("\nWalk-in tokens issued:");
    console.table(results);
  }

  async simulateFollowUpAppointments() {
    this.log("STEP 4: Follow-up Appointments");

    const followUps = [
      {
        doctor: "DOC001",
        patient: "Arjun Gupta",
        id: "P013",
        phone: "9876543222",
      },
      {
        doctor: "DOC002",
        patient: "Meera Kapoor",
        id: "P014",
        phone: "9876543223",
      },
    ];

    const results = [];

    followUps.forEach((followUp) => {
      try {
        const result = this.engine.allocateToken({
          doctorId: followUp.doctor,
          patientId: followUp.id,
          patientName: followUp.patient,
          tokenType: TOKEN_TYPES.FOLLOW_UP,
          phoneNumber: followUp.phone,
          notes: "Follow-up from previous visit",
          date: this.simulationDate,
        });
        results.push({
          patient: followUp.patient,
          tokenNumber: result.token.tokenNumber,
          time: result.token.estimatedTime,
          slot: `${result.slot.startTime}-${result.slot.endTime}`,
        });
      } catch (error) {
        console.log(
          `Failed follow-up for ${followUp.patient}: ${error.message}`,
        );
      }
    });

    console.log("\nFollow-up appointments scheduled:");
    console.table(results);
  }

  async simulatePriorityPatients() {
    this.log("STEP 5: Paid Priority Patients");

    const priorityPatients = [
      {
        doctor: "DOC003",
        patient: "VIP Patient - Ramesh Shah",
        id: "P015",
        phone: "9876543224",
      },
    ];

    const results = [];

    priorityPatients.forEach((patient) => {
      try {
        const result = this.engine.allocateToken({
          doctorId: patient.doctor,
          patientId: patient.id,
          patientName: patient.patient,
          tokenType: TOKEN_TYPES.PAID_PRIORITY,
          phoneNumber: patient.phone,
          notes: "Priority consultation",
          date: this.simulationDate,
        });
        results.push({
          patient: patient.patient,
          tokenNumber: result.token.tokenNumber,
          time: result.token.estimatedTime,
          slot: `${result.slot.startTime}-${result.slot.endTime}`,
          priority: "HIGH",
        });
      } catch (error) {
        console.log(`Failed priority for ${patient.patient}: ${error.message}`);
      }
    });

    console.log("\nPriority tokens issued:");
    console.table(results);
  }

  async simulateCancellation() {
    this.log("STEP 6: Patient Cancellation Scenario");

    const allTokens = this.tokenStore.getAllTokens();
    const tokenToCancel = allTokens.find(
      (t) => t.patientName === "Priya Singh",
    );

    if (tokenToCancel) {
      console.log(
        `\nPatient ${tokenToCancel.patientName} (Token #${tokenToCancel.tokenNumber}) called to cancel`,
      );

      const result = this.engine.cancelToken(
        tokenToCancel.id,
        "Patient requested cancellation",
      );

      const slot = this.slotStore.getSlot(tokenToCancel.slotId);
      console.log(`\n✅ Cancellation processed`);
      console.log(
        `   - Slot capacity freed: ${slot.currentCapacity}/${slot.maxCapacity}`,
      );
      console.log(`   - Available slots now: ${slot.getAvailableSlots()}`);
    }
  }

  async simulateEmergency() {
    this.log("STEP 7: EMERGENCY Patient Arrival");

    console.log("\nEMERGENCY: Critical patient needs immediate attention!");
    console.log("   Patient: Emergency - Cardiac Case");
    console.log("   Preferred doctor: Dr. Sharma (Cardiologist)");

    try {
      const result = this.engine.allocateToken({
        doctorId: "DOC001",
        patientId: "P016",
        patientName: "Emergency - Cardiac Case",
        tokenType: TOKEN_TYPES.EMERGENCY,
        phoneNumber: "9876543225",
        notes: "URGENT: Chest pain, suspected cardiac event",
        date: this.simulationDate,
      });

      console.log("\n Emergency token allocated:");
      console.log(`   Token Number: ${result.token.tokenNumber}`);
      console.log(`   Estimated Time: ${result.token.estimatedTime}`);
      console.log(`   Slot: ${result.slot.startTime}-${result.slot.endTime}`);
      console.log(
        `   Slot Utilization: ${result.slot.currentCapacity}/${result.slot.maxCapacity + result.slot.emergencyBuffer}`,
      );
    } catch (error) {
      console.log(`\n Emergency allocation failed: ${error.message}`);
      console.log("   Attempting reallocation...");
    }
  }

  async simulateSlotDelay() {
    this.log("STEP 8: Doctor Running Late - Slot Delay");

    const slots = this.slotStore.getSlotsByDoctor(
      "DOC002",
      this.simulationDate,
    );
    const morningSlot = slots.find((s) => s.startTime === "10:00");

    if (morningSlot) {
      console.log(
        `\nDr. Patel is running 20 minutes late for ${morningSlot.startTime}-${morningSlot.endTime} slot`,
      );

      const result = this.engine.handleSlotDelay(morningSlot.id, 20);

      const tokens = this.tokenStore.getTokensBySlot(morningSlot.id);

      console.log("\nAll patient times updated:");
      const updatedTimes = tokens.map((t) => ({
        patient: t.patientName,
        tokenNumber: t.tokenNumber,
        originalTime: "(Calculated)",
        newTime: t.estimatedTime,
      }));
      console.table(updatedTimes);
    }
  }

  async simulateNoShow() {
    this.log("STEP 9: No-Show Patient");

    const allTokens = this.tokenStore.getAllTokens();
    const noShowToken = allTokens.find((t) => t.patientName === "Mohan Das");

    if (noShowToken) {
      console.log(
        `\nPatient ${noShowToken.patientName} (Token #${noShowToken.tokenNumber}) did not show up`,
      );

      noShowToken.markNoShow();
      this.tokenStore.updateToken(noShowToken);

      const slot = this.slotStore.getSlot(noShowToken.slotId);
      slot.decrementCapacity();
      this.slotStore.updateSlot(slot);

      console.log(`\nMarked as no-show`);
      console.log(
        `   - Slot capacity updated: ${slot.currentCapacity}/${slot.maxCapacity}`,
      );
    }
  }

  async simulateCheckIns() {
    this.log("STEP 10: Patient Check-ins Throughout the Day");

    const allTokens = this.tokenStore.getAllTokens();
    const tokensToCheckIn = allTokens
      .filter((t) => t.state === TOKEN_STATES.ALLOCATED)
      .slice(0, 5);

    const checkIns = [];

    tokensToCheckIn.forEach((token) => {
      try {
        token.checkIn();
        this.tokenStore.updateToken(token);
        checkIns.push({
          patient: token.patientName,
          token: token.tokenNumber,
          checkedInAt: token.checkedInAt.toLocaleTimeString(),
        });
      } catch (error) {
        console.log(
          `Check-in failed for ${token.patientName}: ${error.message}`,
        );
      }
    });

    console.log("\nPatients checked in:");
    console.table(checkIns);
  }

  async generateFinalReport() {
    this.log("FINAL REPORT: OPD Day Summary");

    const stats = {
      date: this.simulationDate,
      totalSlots: this.slotStore.getAllSlots().length,
      totalTokens: this.tokenStore.getAllTokens().length,
      byType: {},
      byState: {},
      byDoctor: [],
    };

    // Tokens by type
    Object.values(TOKEN_TYPES).forEach((type) => {
      stats.byType[type] = this.tokenStore.getTokensByType(type).length;
    });

    // Tokens by state
    Object.values(TOKEN_STATES).forEach((state) => {
      stats.byState[state] = this.tokenStore.getTokensByState(state).length;
    });

    // Doctor-wise summary
    const doctorIds = ["DOC001", "DOC002", "DOC003"];
    doctorIds.forEach((doctorId) => {
      const slots = this.slotStore.getSlotsByDoctor(
        doctorId,
        this.simulationDate,
      );
      const tokens = this.tokenStore.getTokensByDoctor(doctorId);

      const doctorSlot = slots[0];
      if (doctorSlot) {
        stats.byDoctor.push({
          doctor: doctorSlot.doctorName,
          totalSlots: slots.length,
          totalCapacity: slots.reduce((sum, s) => sum + s.maxCapacity, 0),
          allocatedTokens: tokens.filter(
            (t) =>
              t.state !== TOKEN_STATES.CANCELLED &&
              t.state !== TOKEN_STATES.NO_SHOW,
          ).length,
          cancelled: tokens.filter((t) => t.state === TOKEN_STATES.CANCELLED)
            .length,
          noShows: tokens.filter((t) => t.state === TOKEN_STATES.NO_SHOW)
            .length,
          utilization: `${((tokens.length / slots.reduce((sum, s) => sum + s.maxCapacity, 0)) * 100).toFixed(1)}%`,
        });
      }
    });

    console.log("\nOVERALL STATISTICS");
    console.log("─".repeat(80));
    console.log(`Date: ${stats.date}`);
    console.log(`Total Slots: ${stats.totalSlots}`);
    console.log(`Total Tokens Issued: ${stats.totalTokens}`);

    console.log("\nTOKENS BY TYPE:");
    console.table(stats.byType);

    console.log("\nTOKENS BY STATE:");
    console.table(stats.byState);

    console.log("\nDOCTOR-WISE SUMMARY:");
    console.table(stats.byDoctor);

    // Detailed slot view
    console.log("\nDETAILED SLOT VIEW:");
    const allSlots = this.slotStore.getAllSlots();
    const slotDetails = allSlots.map((slot) => ({
      doctor: slot.doctorName,
      time: `${slot.startTime}-${slot.endTime}`,
      capacity: `${slot.currentCapacity}/${slot.maxCapacity}`,
      utilization: `${slot.getUtilizationPercentage().toFixed(1)}%`,
      delay: `${slot.delayMinutes} min`,
      status: slot.isActive ? "Active" : "Inactive",
    }));
    console.table(slotDetails);
  }

  async run() {
    console.log("\n");
    console.log("--".repeat(40));
    console.log("          MEDOC OPD TOKEN ALLOCATION SYSTEM SIMULATION");
    console.log("                  Complete Day Simulation - 3 Doctors");
    console.log("--".repeat(40));

    try {
      await this.setupDoctorsAndSlots();
      await this.simulateOnlineBookings();
      await this.simulateWalkIns();
      await this.simulateFollowUpAppointments();
      await this.simulatePriorityPatients();
      await this.simulateCancellation();
      await this.simulateEmergency();
      await this.simulateSlotDelay();
      await this.simulateNoShow();
      await this.simulateCheckIns();
      await this.generateFinalReport();

      console.log("\n");
      console.log("==".repeat(40));
      console.log("              SIMULATION COMPLETED SUCCESSFULLY");
      console.log("==".repeat(40));
      console.log("\n");
    } catch (error) {
      console.error("\nSimulation error:", error);
    }
  }
}

// Run simulation if executed directly
if (require.main === module) {
  const simulation = new OPDSimulation();
  simulation.run();
}

module.exports = OPDSimulation;
