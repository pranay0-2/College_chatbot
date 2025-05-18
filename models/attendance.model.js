import mongoose, {Schema} from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: String,
  semester: Number,    // Store the semester
  subject: String,     // Store the subject
  date: { type: Date, default: Date.now },  // Date when the attendance is marked
  studentRecords: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { // 'Present' or 'Absent'
      type: String,
      enum: ['Present' , 'Absent'],
      required: true
    }   
  }],
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);

export default Attendance;

