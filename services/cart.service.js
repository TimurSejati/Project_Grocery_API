var async = require('async');
const { cart } = require('../models/cart.model');

async function addCart(params, callback) {
	if (!params.userId) {
		return callback({
			message: 'UserId required'
		});
	}

	cart.findOne({ userId: params.userId }, function (err, cartDB) {
		if (err) {
			return callback(err);
		}
		else {
			if (cartDB == null) {
				const cartModel = new cart({
					userId: params.userId,
					product: params.products
				});

				cartModel
					.save()
					.then((response) => {
						return callback(null, response);
					})
					.catch((error) => {
						return callback(error);
					})
			}
			else if (cartDB.products.length == 0) {
				cartDB.products = params.products;
				cartDB.save();
				return callback(null, cartDB);
			}
			else {
				async.eachSeries(params.products, function (product, asyncDone) {
					let itemIndex = cartDB.products.findIndex(p => p.product == product.product);

					if (itemIndex === -1) {
						cartDB.products.push(
							{
								product: product.product,
								qty: product.qty
							}
						);
						cartDB.save(asyncDone);
					}
					else {
						cartDB.products[itemIndex].qty = cartDB.products[itemIndex].qty + product.qty;
						cartDB.save(asyncDone);
					}
				});

				return callback(null, cartDB);
			}
		}
	})
}

async function getCart(params, callback) {
	cart.findOne({ userId: params.userId })
		.populate({
			path: 'products',
			populate: {
				path: 'product',
				model: 'Product',
				select: 'productName productPrice, productSalePrice productImages',
				populate: {
					path: 'category',
					model: 'Category',
					select: 'categoryName'
				}
			}
		})
		.then((response) => {
			return callback(null, response);
		})
	// .catch((error) => {
	// 	return callback(error);
	// })
}

async function removeCartItem(params, callback) {
	cart.findOne({ userId: params.userId }, function (err, cartDB) {
		if (err) {
			return callback(err);
		}
		else {
			if (params.productId && params.qty) {
				const productId = params.productId;
				const qty = params.qty;

				if (cartDB.products.length === 0) {
					return callback(null, "Cart empty");
				}
				else {
					let itemIndex = cartDB.products.findIndex(p => p.product == productId);

					if (itemIndex === -1) {
						return callback(null, "Invalid product!");
					}
					else {
						if (cartDB.products[itemIndex].qty === qty) {
							cartDB.products.splice(itemIndex, 1);
						}
						else if (cartDB.products[itemIndex].qty > qty) {
							cartDB.products[itemIndex].qty = cartDB.products[itemIndex].qty - qty;
						}
						else {
							return callback(null, "Enter lower qty!");
						}

						cartDB.save((err, cartM) => {
							if (err) {
								return callback(err);
							}
							return callback(null, "Cart updated");
						})
					}
				}
			}
		}
	})
}

module.exports = {
	addCart,
	getCart,
	removeCartItem
}