import { initialAccounts, initialListings, initialInquiries } from "./data.js";
const wait = (value) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), 380),
  );
let listings = structuredClone(initialListings);
let accounts = structuredClone(initialAccounts);
let inquiries = structuredClone(initialInquiries);
let nextListing = 21,
  nextInquiry = 5,
  nextAccount = 10;

export const api = {
  async getListings(filters = {}) {
    await wait(null);
    let rows = listings.filter(
      (x) => filters.includeHidden || x.status === "Available",
    );
    if (filters.ownerId)
      rows = rows.filter((x) => x.ownerId === filters.ownerId);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      rows = rows.filter((x) =>
        [x.title, x.author, x.isbn].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    if (filters.course)
      rows = rows.filter((x) =>
        x.course.toLowerCase().includes(filters.course.toLowerCase()),
      );
    if (filters.condition)
      rows = rows.filter((x) => x.condition === filters.condition);

    if (filters.min !== "" && filters.min != null)
      rows = rows.filter((x) => x.price >= Number(filters.min));

    if (filters.max !== "" && filters.max != null)
      rows = rows.filter((x) => x.price <= Number(filters.max));

    if (filters.sort === "price-low") rows.sort((a, b) => a.price - b.price);
    else if (filters.sort === "price-high")
      rows.sort((a, b) => b.price - a.price);
    else rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return structuredClone(rows);
  },

  async getListing(id) {
    await wait(null);
    return structuredClone(listings.find((x) => x.id === id) || null);
  },

  async createListing(data, ownerId) {
    await wait(null);
    const row = {
      ...data,
      id: `b${nextListing++}`,
      ownerId,
      status: "Available",
      createdAt: new Date().toISOString(),
      color: "#E4472B",
    };

    listings.unshift(row);
    return structuredClone(row);
  },

  async updateListing(id, data, actor) {
    await wait(null);
    const row = listings.find((x) => x.id === id);
    if (!row || (actor.role !== "admin" && row.ownerId !== actor.id))
      throw Error("You do not have permission to edit this listing.");
    Object.assign(row, data);
    return structuredClone(row);
  },

  async deleteListing(id, actor) {
    await wait(null);
    const row = listings.find((x) => x.id === id);
    if (!row || (actor.role !== "admin" && row.ownerId !== actor.id))
      throw Error("You do not have permission to delete this listing.");
    listings = listings.filter((x) => x.id !== id);
    inquiries = inquiries.filter((q) => q.listingId !== id);
    return true;
  },

  async getAccounts() {
    await wait(null);
    return structuredClone(accounts);
  },

  async register(data) {
    await wait(null);

    if (
      accounts.some((x) => x.email.toLowerCase() === data.email.toLowerCase())
    )
      throw Error("This email is already registered.");

    const row = {
      ...data,
      id: `u${nextAccount++}`,
      role: "student",
      status: "Active",
    };

    accounts.push(row);
    return structuredClone(row);
  },

  async signIn(email, password) {
    await wait(null);
    const row = accounts.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );

    if (!row || password.length < 6)
      throw Error("Email or password is incorrect.");

    if (row.status === "Suspended")
      throw Error(
        "This account is suspended. Please contact the library desk.",
      );

    return structuredClone(row);
  },

  async updateProfile(id, data) {
    await wait(null);
    const row = accounts.find((x) => x.id === id);

    if (!row) throw Error("Account not found.");
    Object.assign(row, data);
    return structuredClone(row);
  },

  async sendInquiry(data, sender) {
    await wait(null);
    const listing = listings.find((x) => x.id === data.listingId);

    if (!listing || listing.status !== "Available")
      throw Error("This book is no longer available.");

    if (listing.ownerId === sender.id)
      throw Error("You cannot message yourself about your own listing.");

    const q = {
      ...data,
      id: `q${nextInquiry++}`,
      senderId: sender.id,
      recipientId: listing.ownerId,
      createdAt: new Date().toISOString(),
    };

    inquiries.unshift(q);
    return structuredClone(q);
  },

  async getInquiries(user) {
    await wait(null);
    return structuredClone(
      inquiries.filter(
        (q) =>
          user.role === "admin" ||
          q.recipientId === user.id ||
          q.senderId === user.id,
      ),
    );
  },
  async adminAccount(id, action) {
    await wait(null);
    const row = accounts.find((x) => x.id === id);

    if (!row) throw Error("Account not found.");

    if (action === "delete") {
      accounts = accounts.filter((x) => x.id !== id);
      return true;
    }

    row.status = action === "suspend" ? "Suspended" : "Active";
    return structuredClone(row);
  },

  async adminListing(id, action) {
    await wait(null);
    const row = listings.find((x) => x.id === id);
    if (!row) throw Error("Listing not found.");

    if (action === "delete")
      return this.deleteListing(id, { role: "admin", id: "admin1" });
    row.status = action;
    return structuredClone(row);
  },
  async getCounts() {
    await wait(null);

    return {
      accounts: accounts.length,
      available: listings.filter((x) => x.status === "Available").length,
      sold: listings.filter((x) => x.status === "Sold").length,
    };
  },
};
