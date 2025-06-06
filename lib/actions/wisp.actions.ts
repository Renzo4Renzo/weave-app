"use server";

import { revalidatePath } from "next/cache";
import { User } from "../models/user.model";
import { Wisp } from "../models/wisp.model";
import { Community } from "../models/community.model";
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

export async function getWisps(pageNumber = 1, pageSize = 20) {
  try {
    connectToDB();

    // Calculate the number of wisps to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a query to fetch the wisps that have no parent (top-level wisps) (a wisp that is not a comment/reply).
    const wispsQuery = Wisp.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children", // Populate the children field
        populate: {
          path: "author", // Populate the author field within children
          model: User,
          select: "_id name parentId image", // Select only _id and username fields of the author
        },
      });

    // Count the total number of top-level wisps i.e., wisps that are not comments.
    const totalWispsCount = await Wisp.countDocuments({
      parentId: { $in: [null, undefined] },
    }); // Get the total count of wisps

    const wisps = await wispsQuery.exec();

    const isNext = totalWispsCount > skipAmount + wisps.length;

    return { wisps, isNext };
  } catch (error: any) {
    throw new Error(`Failed to get wisps: ${error.message}`);
  }
}

export async function createWisp({ text, authorId, communityId, path }: createWispParams) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne({ id: communityId }, { _id: 1 });

    const createdWisp = await Wisp.create({
      text,
      author: authorId,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(authorId, {
      $push: { wisps: createdWisp._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { wisps: createdWisp._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create wisp: ${error.message}`);
  }
}

async function getAllChildWisps(wispId: string): Promise<any[]> {
  const childWisps = await Wisp.find({ parentId: wispId });

  const descendantWisp = [];
  for (const childWisp of childWisps) {
    const descendants = await getAllChildWisps(childWisp._id);
    descendantWisp.push(childWisp, ...descendants);
  }

  return descendantWisp;
}

export async function deleteWisp(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the wisp to be deleted (the main wisp)
    const mainWisp = await Wisp.findById(id).populate("author community");

    if (!mainWisp) {
      throw new Error("Wisp not found");
    }

    // Fetch all child wisps and their descendants recursively
    const descendantWisp = await getAllChildWisps(id);

    // Get all descendant wisps IDs including the main wisp ID and child wisp IDs
    const descendantWispIds = [id, ...descendantWisp.map((wisp) => wisp._id)];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantWisp.map((wisp) => wisp.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainWisp.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantWisp.map((wisp) => wisp.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainWisp.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child wisps and their descendants
    await Wisp.deleteMany({ _id: { $in: descendantWispIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { wisps: { $in: descendantWispIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { wisps: { $in: descendantWispIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete wisp: ${error.message}`);
  }
}

export async function getWispById(id: string) {
  try {
    connectToDB();

    const wisp = await Wisp.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Wisp, // The model of the nested children (assuming it's the same "Wisp" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
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

export async function addCommentToWisp({ wispId, commentText, userId, path }: addCommentParams) {
  try {
    connectToDB();

    //Find the original wisp by ID
    const originalWisp = await Wisp.findById(wispId);

    if (!originalWisp) {
      throw new Error("Wisp not found");
    }

    // Create the new comment wisp
    const commentWisp = new Wisp({
      text: commentText,
      author: userId,
      parentId: wispId, // Set the parentId to the original wisp's ID
    });

    // Save the comment wisp to the database
    const savedCommentWisp = await commentWisp.save();

    // Add the comment wisp's ID to the original wisp's children array
    originalWisp.children.push(savedCommentWisp._id);

    // Save the updated original wisp to the database
    await originalWisp.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to comment: ${error.message}`);
  }
}
