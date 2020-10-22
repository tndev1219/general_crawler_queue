const safeEval = require('safe-eval');
const _ = require('lodash')

// Fetch basic product detail from a global object `runParams`
const getAliFullProductDetail = (dataScript, url) => {

    if (!dataScript) {
        return false;
    }

    const {
        data
    } = safeEval(dataScript);

    const {
        actionModule,
        titleModule,
        storeModule,
        specsModule,
        imageModule,
        pageModule,
        descriptionModule,
        skuModule,
        crossLinkModule,
        recommendModule,
        commonModule,
        webEnv
    } = data;

    /**
     *
     *
     * "product_info_payload": {
        "base_info": {
          "@context": "http://schema.org/",
          "@type": "Product",
          "name": "DANIU Electrical Cutting Plier Wire Cable Cutter Side Snips Flush Pliers Tool",
          "image": "https://imgaz.staticbg.com/thumb/view/oaupload/banggood/images/C0/89/1a59e7fc-4a61-beb9-768b-268edca2cc78.jpg",
          "description": "Only US$3.87, buy best daniu electrical cutting plier wire cable cutter side snips flush pliers tool sale online store at wholesale price.",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": 4.94,
            "reviewCount": 8417
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": "3.87",
            "itemCondition": "http://schema.org/new",
            "availability": "http://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "Banggood"
            },
            "sku": "1046482US"
          },
          "sku": "SKU362882",
          "product_id": "1046482",
          "category_id": "5291",
          "cur_warehouse": "CN"
        },
     */
    let result = {
        base_info: {
            product_id: actionModule.productId,
            link: pageModule.itemDetailUrl,
            language: webEnv.language.toUpperCase(),
            name: titleModule.subject,
            image: pageModule.imagePath,
            description: pageModule.description,
            aggregateRating: {
                ratingValue: titleModule.feedbackRating.averageStar,
                reviewCount: titleModule.feedbackRating.totalValidNum
            },
            store: {
                followingNumber: storeModule.followingNumber,
                establishedAt: storeModule.openTime,
                positiveNum: storeModule.positiveNum ? storeModule.positiveNum : null,
                positiveRate: storeModule.positiveRate ? storeModule.positiveRate : null,
                name: storeModule.storeName,
                id: storeModule.storeNum,
                url: `https:${storeModule.storeURL}`,
                topRatedSeller: storeModule.topRatedSeller,
            },
            orders: titleModule.tradeCount,
            specs: specsModule.props ? specsModule.props : [],
            /*categories: crossLinkModule.breadCrumbPathList
                .map(breadcrumb => breadcrumb.target)
                .filter(breadcrumb => breadcrumb),*/
            wishedCount: actionModule.itemWishedCount,
            quantity: actionModule.totalAvailQuantity,
            companyId: recommendModule.companyId,
            memberId: commonModule.sellerAdminSeq
        },
        //additional_info: data
    };

    result.additional_info = {}

    result.additional_info.product_images = imageModule.imagePathList
    result.additional_info.product_description_images = []
    result.additional_info.attributes = _.map(skuModule.productSKUPropertyList, function (productSKUPropertyItem) {
        return {
            name: productSKUPropertyItem.skuPropertyName,
            id: productSKUPropertyItem.skuPropertyId,
            is_color: productSKUPropertyItem.showTypeColor,
            options: _.map(productSKUPropertyItem.skuPropertyValues, function (skuPropertyValue) {
                let prop = {
                    id: skuPropertyValue.propertyValueId,
                    id_long: skuPropertyValue.propertyValueIdLong,
                    name: skuPropertyValue.propertyValueName,
                    color: skuPropertyValue.skuColorValue,
                    picture_url: skuPropertyValue.skuPropertyImagePath
                }

                if(skuPropertyValue.propertyValueName != skuPropertyValue.propertyValueDisplayName){
                    prop.display_name = skuPropertyValue.propertyValueDisplayName
                }
                return prop
            })
        }
    })

    result.base_info.offers = _.map(skuModule.skuPriceList, function (skuPriceItem) {
        return {
            sku: skuPriceItem.skuPropIds,
            sku_info: skuPriceItem.skuAttr,
            id: skuPriceItem.skuId,
            quantity: skuPriceItem.skuVal.availQuantity,
            special_price: skuPriceItem.skuVal.skuActivityAmount ? skuPriceItem.skuVal.skuActivityAmount.value : null,
            price: skuPriceItem.skuVal.skuAmount.value,
            currency: skuPriceItem.skuVal.skuAmount.currency
        }
    })

    result.additional_info.brand_name = null
    result.additional_info.brand_url = null

    if (specsModule.props) {
        let brand = specsModule.props.find(function (item) {
            return item.attrNameId == 2
        })

        if (brand) {
            result.additional_info.brand_name = brand.attrValue
        }
    }

    let lastCat = _.last(crossLinkModule.breadCrumbPathList)
    result.base_info.category_id = lastCat.cateId
    result.categories = crossLinkModule.breadCrumbPathList.map(breadcrumb => {
        return {
            id: breadcrumb.cateId,
            name: breadcrumb.name
        }
    }).filter(function (item) {
        return item.id && item.name
    })

    result.language = webEnv.language.toUpperCase()
    return result;
};

const getAliStockProductDetail = (dataScript, url) => {

    if (!dataScript) {
        return false;
    }

    const {
        data
    } = safeEval(dataScript);

    const {
        actionModule,
        skuModule,
    } = data;

    let result = {
        product_id: actionModule.productId,
        quantity: actionModule.totalAvailQuantity,
    };

    result.offers = _.map(skuModule.skuPriceList, function (skuPriceItem) {
        return {
            sku: skuPriceItem.skuPropIds,
            sku_info: skuPriceItem.skuAttr,
            id: skuPriceItem.skuId,
            quantity: skuPriceItem.skuVal.availQuantity,
            special_price: skuPriceItem.skuVal.skuActivityAmount ? skuPriceItem.skuVal.skuActivityAmount.value : null,
            price: skuPriceItem.skuVal.skuAmount.value,
            currency: skuPriceItem.skuVal.skuAmount.currency
        }
    })

    return result;
};

// Get description HTML of product
const getAliProductDescription = ($) => {
    return $.html();
};

const getBangFullProductDetail = ($) => {
    var result = {};
    result.base_info = {};
    result.additional_info = {};

    if (!$) {
        return false;
    }

    try {
        result.base_info = JSON.parse($('script[type="application/ld+json"]').html().trim().slice(0, -1));
        delete result.base_info.image // delete low resolution picture
        result.base_info.link = $('meta[property="og:url"]').attr('content');
    } catch (e) {
        result.base_info = null;
    }

    result.categories = []
    $('ol.breadcrumb li>a').each(function (index, item) {
        var breadcrumbLi = $(item);
        var catHref = breadcrumbLi.prop('href');
        if (catHref.indexOf('-c-') > 0 && catHref.indexOf('html') > 0) {
            var category = {}
            category.id = catHref.split('-c-')[1].split('.html')[0];
            category.name = breadcrumbLi.text();
            result.categories.push(category);
        }
    });

    if ($('.item_brand_box').length === 0) {
        result.additional_info.brand_name = null;
        result.additional_info.brand_url = null;
    } else {
        result.additional_info.brand_name = $('.item_brand_box').children().text();
        result.additional_info.brand_url = $('.item_brand_box').children().attr('href');
    }

    if ($('.item_main_left').length === 0) {
        result.additional_info.product_images = null;
    } else {
        result.additional_info.product_images = [];
        $($('.item_main_left').find('.thumbnail-box')[0]).find('li').map((key, item) => {
            result.additional_info.product_images.push($(item).data('large'));
        });
    }

    if ($('#imgBox').length === 0) {
        result.additional_info.product_description_images = null;
    } else {
        result.additional_info.product_description_images = [];
        $('#imgBox').find('img').map((key, item) => {
            var additionalImageUrl = $(item).data('original');
            if(additionalImageUrl){
                result.additional_info.product_description_images.push(additionalImageUrl);
            }
        });
    }

    if ($('.addToCartBtn_box').length === 0) {
        result.additional_info.cart_info = null;
    } else {
        result.base_info.product_id = $($('.addToCartBtn_box').find('#products_id')[0]).attr('value');
        result.base_info.category_id = $($('.addToCartBtn_box').find('#botCat')[0]).attr('value');
        result.base_info.sku = $($('.addToCartBtn_box').find('#sku')[0]).attr('value');
        result.base_info.cur_warehouse = $($('.addToCartBtn_box').find('#curWarehouse')[0]).attr('value');
    }

    result.additional_info.attributes = [];

    if ($('.item_color_box').length === 0) {
    } else {
        var attribute = {};
        attribute.name = $('.item_color_box').data('text');
        attribute.id = $('.item_color_box').attr('option_id');
        attribute.is_color = true;
        attribute.options = [];

        $('.item_color_box').find('li').map((key, item) => {
            var data = {};
            data.name = $(item).data('name');
            data.picture_url = $(item).data('large');
            data.id = $(item).children().attr('value_id');
            attribute.options.push(data);
        });

        result.additional_info.attributes.push(attribute);
    }

    if ($('.item_size_box').length === 0) {
    } else {
        $('.item_size_box').map((key, object) => {
            var item_size_box = {};
            item_size_box.name = $(object).data('text');
            //item_size_box.data_en_name = $(object).data('en-name');
            item_size_box.id = $(object).attr('option_id');
            item_size_box.is_color = false;
            item_size_box.options = [];
            $(object).find('.listSize').map((key, item) => {
                var data = {};
                data.name = $(item).data('name');
                data.picture_url = $(item).data('large') ? $(item).data('large') : null;
                data.id = $(item).children().attr('value_id');
                item_size_box.options.push(data);
            });
            result.additional_info.attributes.push(item_size_box);
        });
    }

    if ($('.jsPolytypeContWrap').length === 0) {
        result.additional_info.description = null;
    } else {
        $('.jsPolytypeContWrap > div[aria-cont=productdetails] #coupon_banner').remove();
        $('.jsPolytypeContWrap > div[aria-cont=productdetails] div.Compatibility').remove();

        $('.jsPolytypeContWrap > div[aria-cont=productdetails] img.bg_lazy').remove();
        $('.jsPolytypeContWrap > div[aria-cont=productdetails] #imgBox').remove();

        result.additional_info.description = $('.jsPolytypeContWrap > div[aria-cont=productdetails]').html();
    }

    return result;
};

const getGearbestFullProductDetail = ($) => {
    var result = {};
    result.base_info = {};
    result.additional_info = {};

    if (!$) {
        return false;
    }

    try {
        result.base_info = JSON.parse($('script[type="application/ld+json"]').html().trim());
    } catch (e) {
        result.base_info = null;
    }

    var temp = $($('script').filter((i, script) => $(script).html().includes('goodsLink')).get()[0]).html().split('JSON.stringify(')[1];
    if (temp) {
        temp = eval("(" + temp.split('));')[0] + ")");
        result.additional_info = Object.assign({}, temp);
    }

    if ($('.goodsIntro_thumbnailImg').length === 0) {
        result.additional_info.product_images = null;
    } else {
        result.additional_info.product_images = {};
        result.additional_info.product_images.small_image = [];
        result.additional_info.product_images.big_image = [];
        $('.goodsIntro_thumbnailImg').map((key, item) => {
            result.additional_info.product_images.small_image.push($(item).data('normal-src'));
            result.additional_info.product_images.big_image.push($(item).data('origin-src'));
        });
    }

    temp = $($('script').filter((i, script) => $(script).html().includes('goodsLink')).get()[0]).html().split('goodsLink = ')[1];
    if (temp) {
        temp = eval("(" + temp.split(';')[0] + ")");
        result.additional_info.variants_warehouses_info = [];
        result.additional_info.variants_warehouses_info = temp;
    }

    if ($('#anchorGoodsDesc').length === 0) {
        result.additional_info.description = null;
    } else {
        result.additional_info.description = $('#anchorGoodsDesc').html();
    }

    return result;
};

const getEmmaFullProductDetail = ($) => {
    var result = {};
    result.base_info = {};
    result.additional_info = {};

    if (!$) {
        return false;
    }

    try {
        var temp = $($('script').filter((i, script) => $(script).html().includes('GB_goods')).get()[0]).html().split('GB_goods = ')[1].split('var GB_sizeInfo')[0];
        result.base_info = JSON.parse(temp.trim().slice(0, -1));
    } catch (e) {
        result.base_info = null;
    }

    result.additional_info.size_reference = {};
    try {
        var temp = $($('script').filter((i, script) => $(script).html().includes('GB_sizeInfo')).get()[0]).html().split('GB_sizeInfo = ')[1].split('var GB_sizeAttr')[0];
        result.additional_info.size_reference = JSON.parse(temp.trim().slice(0, -1));
    } catch (e) {
        result.additional_info.size_reference = null;
    }

    result.additional_info.size_guide = {};
    try {
        var temp = $($('script').filter((i, script) => $(script).html().includes('GB_child_data')).get()[0]).html().split('GB_child_data = ')[1].split('function')[0];
        temp = eval("(" + temp.split('));')[0] + ")");
        result.additional_info.size_guide = Object.assign({}, temp);
    } catch (e) {
        result.additional_info.size_guide = null;
    }

    result.additional_info.snippet_info = {};
    try {
        result.additional_info.snippet_info = JSON.parse($('script[type="application/ld+json"]').html().trim());
    } catch (e) {
        result.additional_info.snippet_info = null;
    }

    if ($('.ItemSpecificationCenter').length === 0) {
        result.additional_info.product_specification = null;
    } else {
        result.additional_info.product_specification = $('.ItemSpecificationCenter').html();
    }

    if ($('.good_size_row').length === 0) {
        result.additional_info.size_attribute = null;
    } else {
        result.additional_info.size_attribute = $('.good_size_row').html();
    }

    try {
        var temp = $($('script').filter((i, script) => $(script).html().includes('hiddenInputId')).get()[0]).html().split('hiddenInputId=')[1].split(';')[0];
        result.additional_info.cart_attributes_id = temp;
    } catch (e) {
        result.additional_info.cart_attributes_id = null;
    }

    return result;
};

const getSheinFullProductDetail = ($) => {
    var result = {};
    result.base_info = {};
    result.additional_info = {};

    if (!$) {
        return false;
    }

    try {
        var temp = $($('script').filter((i, script) => $(script).html().includes('productIntroData')).get()[0]).html().split('window.goodsDetailv2SsrData = ')[1];
        temp = eval("(" + temp + ")");
        result.base_info = Object.assign({}, temp).productIntroData;
    } catch (e) {
        result.base_info = null;
    }

    return result;
};

module.exports = {
    getAliFullProductDetail,
    getAliStockProductDetail,
    getAliProductDescription,
    getBangFullProductDetail,
    getGearbestFullProductDetail,
    getEmmaFullProductDetail,
    getSheinFullProductDetail
};
