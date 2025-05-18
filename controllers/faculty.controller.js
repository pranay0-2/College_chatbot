import Attendance from '../models/attendance.model.js';  // Import Attendance model
import { User } from "../models/user.model.js" // Student/Faculty model
import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"


// 1️⃣ Load Students API
const loadStudents = async (req, res) => {
  try {
    const { department, semester } = req.body;

    if (!department || !semester) {
      return res.status(400).json({ message: "Department and semester are required" });
    }

    const students = await User.find({
      role: "Student",
      department: department,
      semester: semester
    }).select("fullName");

    res.status(200).json(students);
  } catch (error) {
    console.error("Error loading students:", error);
    error: error.message
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// API to save attendance data
const saveAttendance = async (req, res) => {
  
  const { facultyId, department, semester, subject, studentRecords, date } = req.body;

  // Use current date if date is not provided
  const attendanceDate = date || new Date();

  try {
    // Create a new attendance record
    const newAttendance = new Attendance({
      facultyId,
      department,
      semester,
      subject,
      date: attendanceDate,
      studentRecords,
    });

    // Save attendance record to database
    await newAttendance.save();

    res.status(200).json({ message: "Attendance saved successfully!" });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ message: "Failed to save attendance" });
  }
};


const getAbsenteeSummary = async (req, res) => {
  const { facultyId } = req.query;

  const today = new Date();
   today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);

  try {
    const records = await Attendance.find({
      facultyId,
      date: { $gte: yesterday }
    });

    const summary = {};

    for (const record of records) {
      const recordDate = new Date(record.date);
      recordDate.setUTCHours(0, 0, 0, 0); 
      
      
      const key = `${record.department}-${record.semester}-${record.subject}`;
      const absentCount = record.studentRecords.filter(
        s => s.status === "Absent"
      ).length;

      if (!summary[key]) {
        summary[key] = {
          department: record.department,
          semester: record.semester,
          subject: record.subject,
          todayAbsent: 0,
          yesterdayAbsent: 0
        };
      }


      if (recordDate.getTime() === today.getTime()) {
        summary[key].todayAbsent += absentCount;
      } else if (recordDate.getTime() === yesterday.getTime()) {
        summary[key].yesterdayAbsent += absentCount;
      }

    }

    res.json(Object.values(summary)); // send as array of sections
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};



const getAttendanceHistory = async (req, res) => {
  try {
    const { facultyId, department, semester, subject } = req.query;

    const attendance = await Attendance.find({
      facultyId,
      department,
      semester,
      subject
    }).sort({ date: -1 });  // Sort by date, most recent first

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export {
  saveAttendance,
  loadStudents,
  getAbsenteeSummary,
  getAttendanceHistory
};  // Export function for use in routes


