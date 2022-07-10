const { relatedProduct } = require('../models/related-products.model');
const { product } = require('../models/product.model');

async function addRelatedProduct(params, callback) {
	if (!params.product) {
		return callback({
			message: 'Product id required'
		});
	}

	if (!params.relatedProduct) {
		return callback({
			message: 'Related product id required'
		});
	}

	const relatedPorductModel = new relatedProduct(params);
	relatedPorductModel
		.save()
		.then(async (response) => {
			await product.findOneAndUpdate({
				_id: params.product
			},
				{
					$addToSet: {
						'relatedProducts': relatedPorductModel
					}
				});
			return callback(null, response);
		})
		.catch((error) => {
			return callback(error);
		})
}


async function removeRelatedProduct(params, callback) {
	const id = params.id;

	relatedProduct.findByIdAndRemove(id)
		.then((response) => {
			if (!response) {
				callback('Product id not found');
			}
			else {
				callback(null, response);
			}
		})
		.catch((error) => {
			return callback(error);
		})
}

module.exports = {
	addRelatedProduct,
	removeRelatedProduct
}