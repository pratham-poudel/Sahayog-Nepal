// Mock data for recent donations to campaigns
const recentDonations = {
  "67f74575ac5b9943fab1860f": [
    {
      id: "d1",
      name: "Anish Sharma",
      amount: 5000,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      message: "Keep up the good work!"
    },
    {
      id: "d2",
      name: "Priya Karki",
      amount: 2500,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      message: "Happy to support this cause"
    },
    {
      id: "d3",
      name: "Raj Patel",
      amount: 10000,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      message: null
    },
    {
      id: "d4",
      name: "Meera Shah",
      amount: 1000,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      message: "Every bit helps!"
    },
    {
      id: "d5",
      name: "Anonymous",
      amount: 15000,
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
      message: null
    },
    {
      id: "d6",
      name: "Sarita Thapa",
      amount: 3000,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      message: "For a better future"
    },
    {
      id: "d7",
      name: "Ramesh Adhikari",
      amount: 7500,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      message: "Proud to contribute"
    },
    {
      id: "d8",
      name: "Anonymous",
      amount: 500,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      message: null
    },
    {
      id: "d9",
      name: "Binod Shrestha",
      amount: 20000,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      message: "Looking forward to seeing the impact!"
    },
    {
      id: "d10",
      name: "Asha Gurung",
      amount: 2000,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      message: "Hope this helps"
    }
  ],
  // Add more campaign IDs as needed
};

export default recentDonations; 