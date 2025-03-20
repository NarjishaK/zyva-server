const Purchase = require("../models/purchase");
const asyncHandler = require("express-async-handler");

const generatePurchaseId = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString().slice(-2);
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const datePrefix = `PUR${year}${month}${day}`;

    let sequence = 1;
    let purchaseId;
    let isUnique = false;

    while (!isUnique) {
        purchaseId = `${datePrefix}-${sequence.toString().padStart(4, '0')}`;
        const existingPurchase = await Purchase.findOne({ purchaseId });
        if (!existingPurchase) {
            isUnique = true;
        } else {
            sequence++;
        }
    }

    return purchaseId;
};

// Create purchase
exports.create = asyncHandler(async (req, res) => {
    const purchaseId = await generatePurchaseId();
    const newPurchase = new Purchase({ purchaseId, ...req.body });

    const savedPurchase = await newPurchase.save();
    res.status(201).json(savedPurchase);
});

//get all purchases
exports.getAll = asyncHandler(async (req, res) => {
    const purchases = await Purchase.find();
    res.status(200).json(purchases);
})  

//get by Id
exports.get = asyncHandler(async (req, res) => {
    const purchase = await Purchase.findById(req.params.id);
    res.status(200).json(purchase);
})

//update purchase
exports.update = asyncHandler(async (req, res) => {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(purchase);
})

//delete purchase
exports.delete = asyncHandler(async (req, res) => {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    res.status(200).json(purchase);
})

//delete all purchases
exports.deleteAll = asyncHandler(async (req, res) => {
    const purchases = await Purchase.deleteMany();
    res.status(200).json(purchases);
})


