import { Request, Response } from "express";
import Inquiry from "../models/Inquiry";

// @desc    Create a new inquiry
// @route   POST /api/v1/inquiries
// @access  Public
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and message",
      });
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: inquiry,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get all inquiries
// @route   GET /api/v1/inquiries
// @access  Private/Admin
export const getAllInquiries = async (_req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Update inquiry status
// @route   PATCH /api/v1/inquiries/:id
// @access  Private/Admin
export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    inquiry.status = status;
    await inquiry.save();

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
