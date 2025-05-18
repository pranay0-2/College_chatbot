import { Router } from "express";

import {
    loadStudents,
    saveAttendance,
    getAttendanceHistory,
    getAbsenteeSummary
} from "../controllers/faculty.controller.js"

const router  = Router()

router.route("/load-students").post(loadStudents)
router.route("/mark-Attendance").post(saveAttendance)
router.route("/get-absentee-summary").get(getAbsenteeSummary)
router.route("/get-attendance-history").get(getAttendanceHistory)

export default router