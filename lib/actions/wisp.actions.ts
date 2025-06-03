"use server";

import { revalidatePath } from "next/cache";
import { User } from "../models/user.model";
import { Wisp } from "../models/wisp.model";
import { connectToDB } from "../mongoose";

interface createWispParams {
  text: string;
  authorId: string;
  communityId: string | null;
  path: string;
}

interface addCommentParams {
  wispId: string;
  commentText: string;
  userId: string;
  path: string;
}

export async function createWisp(params: createWispParams) {
  try {
    connectToDB();

    const createdWisp = await Wisp.create({
      text: params.text,
      author: params.authorId,
      community: null,
    });

    //Update user
    await User.findByIdAndUpdate(params.authorId, {
      $push: { wisps: createdWisp._id },
    });

    revalidatePath(params.path);
  } catch (error: any) {
    throw new Error(`Failed to create wisp: ${error.message}`);
  }
}

export async function getWisps(pageNumber = 1, pageSize = 20) {
  try {
    connectToDB();

    // Calculated the number of wisps to skip
    const skipAmount = (pageNumber - 1) * pageSize;

    //Get Wisps without parents (top-level parents)
    const wispsQuery = Wisp.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })
      .populate({ path: "children", populate: { path: "author", model: User, select: "_id name parentId image" } });

    const totalWispsCount = await Wisp.countDocuments({ parentId: { $in: [null, undefined] } });

    const wisps = await wispsQuery.exec();

    const isNext = totalWispsCount > skipAmount + wisps.length;

    return { wisps, isNext };
  } catch (error: any) {
    throw new Error(`Failed to get wisps: ${error.message}`);
  }
}

export async function getWispById(id: string) {
  try {
    connectToDB();

    //TODO: Populate community
    const wisp = await Wisp.findById(id)
      .populate({ path: "author", model: User, select: "_id id name image" })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Wisp,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return wisp;
  } catch (error: any) {
    throw new Error(`Failed to get wisp: ${error.message}`);
  }
}

export async function addCommentToWisp(params: addCommentParams) {
  try {
    connectToDB();

    //Find the original wisp by ID
    const originalWisp = await Wisp.findById(params.wispId);

    if (!originalWisp) {
      throw new Error("Wisp not found");
    }

    //Create a new wisp with the comment text
    const commentWisp = new Wisp({
      text: params.commentText,
      author: params.userId,
      parentId: params.wispId,
    });

    // Save the new wisp
    const savedCommentWisp = await commentWisp.save();

    // Update the original wisp to include the new comment
    originalWisp.children.push(savedCommentWisp._id);

    // Save the original wisp
    await originalWisp.save();

    revalidatePath(params.path);
  } catch (error: any) {
    throw new Error(`Failed to comment: ${error.message}`);
  }
}
