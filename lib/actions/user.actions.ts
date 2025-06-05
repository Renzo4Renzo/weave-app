"use server";

import { revalidatePath } from "next/cache";
import { User } from "../models/user.model";
import { connectToDB } from "../mongoose";
import { Wisp } from "../models/wisp.model";
import { FilterQuery, SortOrder } from "mongoose";

interface UpsertUserParams {
  userId: string;
  username: string;
  name: string;
  image: string;
  path: string;
  bio?: string;
}

interface GetUserParams {
  userId: string;
  searchString: string;
  pageNumber: number;
  pageSize: number;
  sortBy?: SortOrder;
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

export async function getUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: GetUserParams) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId },
    };

    if (searchString.trim() !== "") {
      query.$or = [{ username: { $regex: regex } }, { name: { $regex: regex } }];
    }

    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query).sort(sortOptions).skip(skipAmount).limit(pageSize);

    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    //Find all wisps created by the user
    const userWisps = await Wisp.find({ author: userId });

    //Collect all the child wisp ids (replies) from the 'children'
    const childWispsIDs = userWisps.reduce((acc, userWisp) => {
      return acc.concat(userWisp.children);
    }, []);

    // Get replies from other accounts
    const replies = await Wisp.find({ _id: { $in: childWispsIDs }, author: { $ne: userId } }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error: any) {
    throw new Error(`Failed to get activity: ${error.message}`);
  }
}
