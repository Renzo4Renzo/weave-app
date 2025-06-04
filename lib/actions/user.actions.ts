"use server";

import { revalidatePath } from "next/cache";
import { User } from "../models/user.model";
import { connectToDB } from "../mongoose";
import { Wisp } from "../models/wisp.model";

interface UpsertUserParams {
  userId: string;
  username: string;
  name: string;
  image: string;
  path: string;
  bio?: string;
}

export async function upsertUser(params: UpsertUserParams): Promise<void> {
  try {
    connectToDB();
    await User.findOneAndUpdate(
      { id: params.userId },
      {
        username: params.username.toLowerCase(),
        name: params.name,
        bio: params.bio,
        image: params.image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (params.path === "/profile/edit") {
      revalidatePath(params.path);
    }
  } catch (error: any) {
    throw new Error(`Failed to upsert user: ${error.message}`);
  }
}

export async function getUser(userId: string) {
  try {
    connectToDB();
    return await User.findOne({ id: userId });
    // populate({ path: "communities", model: Community });
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function getUserWisps(userId: string) {
  try {
    connectToDB();

    //Find all wisps authored by user with the given userId
    //TODO: Populate community
    const wisps = await User.findOne({ id: userId }).populate({
      path: "wisps",
      model: Wisp,
      populate: { path: "children", model: Wisp, populate: { path: "author", model: User, select: "name image id" } },
    });

    return wisps;
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}
