const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
const { isValidObjectId } = require('mongoose')

//======================================================addCart==================================================================================


const addCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { productId, quantity } = data
        productId = productId.trim()
        quantity = data.quantity

        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorizes Acces" })
        }
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Provide The data " })
        }
        if (!data.productId.trim()) {
            return res.status(400).send({ status: false, message: "Provide the Product Id " })
        }
        if (quantity <= 0) {
            return res.status(400).send({ status: false, message: " if you want to add quantity please put more than: 0 " })
        }
        if (!quantity) {
            quantity = 1
            data['quantity'] = quantity
        }

        // if(data.quantity){
        if (typeof quantity != 'number') {
            return res.status(400).send({ status: false, message: "Quantity Should only Be Number" })
        }
        // }

        //-----------------------------Checking User
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" })
        }
        let userExist = await userModel.findById(userId)
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" })
        }

        //---------------------------Product Id Validation            
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid Product Id" })
        }
        let prodExist = await productModel.findById({ _id: productId, isDeleted: false })
        if (!prodExist) {
            return res.status(404).send({ status: false, message: "Either Product is Deleted or Doesn't Exist" })
        }
        let totalPrice = prodExist.price * data.quantity
        let totalItems = 1

        let isCart = await cartModel.findOne({ userId: userId })
        if (!isCart) {
            let newObj = {}
            let ab = {
                productId: productId,
                quantity: data.quantity
            }
            let items = []
            items.push(ab)
            newObj['userId'] = userId
            newObj['items'] = items
            newObj['totalPrice'] = totalPrice
            newObj['totalItems'] = totalItems
            let createCart = await cartModel.create(newObj)
            return res.status(201).send({ status: true, message: "Cart Created Succesfullt", data: createCart })
        }
        else {
            let flag = 0

            for (let i = 0; i < isCart.items.length; i++) {
                if (isCart.items[i].productId == productId) {
                    isCart.items[i].quantity += parseInt(quantity)
                    flag = 1
                    break;

                }
            }
            if (flag == 0) {
                let obj = {
                    productId: productId,
                    quantity: data.quantity
                }
                isCart.items.push(obj)

            }

            isCart.totalPrice += totalPrice
            isCart.totalItems = isCart.items.length

            let addtoCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: isCart }, { new: true })
            return res.status(200).send({ status: true, message: "Product Added to Cart Successfully", data: addtoCart })
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//======================================================getCart==================================================================================


const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorizes Acces" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" })
        }
        let userExist = await userModel.findById(userId)
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" })
        }

        let isCart = await cartModel.findOne({ userId: userId }).populate("items.productId", { createdAt: 0, updatedAt: 0, __v: 0 })
        if (!isCart) {
            return res.status(404).send({ status: false, message: "There Is Nothing In ur Cart" })
        }
        else {
            return res.status(200).send({ status: true, data: isCart })
        }


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//======================================================deleteCart==================================================================================



const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorizes Acces" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" })
        }
        let userExist = await userModel.findById(userId)
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" })
        }

        let isCart = await cartModel.findOne({ userId: userId })
        if (!isCart) {
            return res.status(404).send({ status: false, message: "There Is Nothing In ur Cart" })
        }
        else {
            isCart.totalItems = 0
            isCart.totalPrice = 0
            isCart.items = []
            let delCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: isCart }, { new: true })
            return res.status(204).send({ status: true, message: "Cart Deleted Succesfully", data: delCart })
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}
module.exports = { addCart, getCart, deleteCart }