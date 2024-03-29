/**
 *
 *Importing Required Modules
 */

var twilio = require('twilio');
var unirest = require('unirest');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var Cloudant = require('cloudant');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

/**
 * Global Varibles
 */
var flag = 0;
var db;
var ExamType, RegdNum;
/**
 *
 *Application Credentials
 */
var sample = [];
var twilioSid = 'AC9fe9723dc5c85b98f6e6a6a7dfc37370';
var twilioToken = 'ccc7ab7e07b40964cbdfc3ab08c8619e';
//var twilioSid = 'AC99ae467839c9f3d07731c9f997fe66cc';
//var twilioToken ='8d04e4b024ce0dd6b5a700df432e4280';
var me = 'gkotha';
var password = '1234567890';
var cloudant = Cloudant({
	account: me,
	password: password
});

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function(req, res, next)
{
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});
app.use(bodyParser.json());
var port = (process.env.PORT || 3001);
var contextw = {}; // Context variable
//Static files
app.use(express.static(__dirname + '/public'));
//Serving HTML file to send Message to Watson
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
var json1 = {};
var a = {};
var order = [];
var context = {};
var rev;
var id;
var conversation = new ConversationV1({
	username: '4fdf917b-4b28-4257-a770-f19b900ec956',
	password: 'Mvi1gFxWXBNK',
	version_date: '2017-06-01'
});
var client = twilio('AC9fe9723dc5c85b98f6e6a6a7dfc37370', 'ccc7ab7e07b40964cbdfc3ab08c8619e')
var document = cloudant.db.use('interface');


function fty(input, contextr, callback) {

	var payload = {
		workspace_id: 'f1ebae45-176c-49a9-bf17-7962e0ecd162',
		input: {
			'text': input
		},
		context: contextr
	};
	conversation.message(payload, function (err, response) {

		if (err) {
			console.log(err)
		} else {
			console.log(response);
			callback(response);
		}
	})
}

function send(tonumber, message, callback) {
	//console.log('msg',message)	
	var info = {
		to: tonumber,
		from: '+1 2486005261',
		body: message

	};

	client.messages.create(info, function (err, response) {

		callback(response);
	});

}

app.post('/message', function (req, res) {
	console.log("response" + JSON.stringify(req.body));
	var db = cloudant.db.use("interface");

	db.get(req.body.From, function (err, data) {


		console.log(data);

		if (err) {

			fty(req.body.Body, {}, function (response1) {
				console.log(response1);
				document.insert({
					"context": response1.context
				}, req.body.From, function (err, body, header) {

					if (err) {
						return console.log('[alice.insert] ', err.message);
					}



				});

				send(req.body.From, response1.output.text[0], function (response) {

					res.send(response.body);

				});
			});

		} else {





			fty(req.body.Body, data.context, function (response1) {
				console.log(response1.context.OrderID)
				if (response1.context.action == "forward") {

					if (response1.context.OrderID == undefined) {
						console.log("forward Action")
						var document = cloudant.db.use('interface')
						data.context = response1.context;
						var rev = data.rev_id;
						id = data._id;


						document.insert(data, req.body.From, rev, id, function (err, body, header) {
							if (err) {
								return console.log('[alice.insert] ', err.message);
							}
						});
						send(req.body.From, response1.output.text, function (response) {
							res.send(response.body);

						});
					} else {
						if (response1.context.OrderID) {
							if (response1.intents[0].intent == "Claim") {

								function user() {

									return new Promise(function (resolve, reject) {
										unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
											.end(function (response, err) {

												if (response.body.output) {
													var str = response.body.output;
													console.log(str);
													if (str.match("is Valid Order")) {

														var numberPattern = /\d+/g;
														var sample = response.body.output.match(numberPattern)


														console.log(JSON.parse(sample));
														resolve(JSON.parse(sample))
														response = {
															"result": "valid order "
														}
														console.log(response);

													} else {
														response = {
															"result": "I was not able to find any orders with that number, please try again."


														}
														console.log(response)
														send(req.body.From, response.result, function (response) {
															console.log(response);
														})
													}
												} else {
													response = {
														"result": err
													}
													console.log(err)
													response = "Problem in the API"
													send(req.body.From, response, function (response) {
														console.log(response);
													})
												}

											});
									});
								}
								var a = []

								function user1(args1) {
									return new Promise(function (resolve, reject) {

										unirest.get('http://interfacemss.mybluemix.net/orders/order/claims?orderId=' + args1)
											.end(function (response, err) {
												if (response) {

													if (response.body.output.length > 0) {
														a.push({
															"OrderID": response.body.output[0].orderId,
															"Date": response.body.output[0].DateUpdated,
															"Status": response.body.output[0].CaseStatus

														})

														resolve(a)


													} else {
														response = {
															"result": "err"
														}
														res.json(response);

													}

												} else {
													response = {
														"result": "err"
													}
													res.json(response);
													response = "Problem In the API"
													send(req.body.From, response, function (response) {
														console.log(response);
													})
												}


											})
									})
								}

								function user2(args2) {

									console.log(args2[0].Status);
									console.log(args2[0].OrderID)
									unirest.get('http://interfacemss.mybluemix.net/claims/code?code=' + args2[0].Status)
										.end(function (response, err) {
											if (response) {

												console.log(response.body.output);
												if (response) {

													response = "Claim #" + args2[0].OrderID + " is for " + args2[0].Date + " and is currently  " + (response.body.output.Description).toLowerCase()



													var document = cloudant.db.use('interface')
													data.context = response1.context;
													var rev = data.rev_id;
													id = data._id;


													document.insert(data, req.body.From, rev, id, function (err, body, header) {
														if (err) {
															return console.log('[alice.insert] ', err.message);
														}
													});
													send(req.body.From, response, function (response) {
														res.send(response.body);
													});
												} else {
													response = {
														"result": "err"
													}
													res.json(response);

												}

											} else {
												response = {
													"result": "err"
												}
												res.json(response);
												response = "Problem In the API"
												send(req.body.From, response, function (response) {
													console.log(response);
												})
											}


										})





								}

								user().then(function (data) {
									console.log(data);
									user1(data).then(function (data1) {
										console.log(data1);
										user2(data1);
									});
								});
							} else if (response1.intents[0].intent == "Invoice") {
								//response1.context.OrderID=response1.entities[0].value
								console.log("invoice")

								function user() {

									return new Promise(function (resolve, reject) {
										unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
											.end(function (response, err) {
												console.log(response.body.output);
												if (response.body.output) {
													var str = response.body.output;
													console.log(str);
													if (str.match("is Valid Order")) {

														var numberPattern = /\d+/g;
														var sample = response.body.output.match(numberPattern)


														console.log(JSON.parse(sample));
														resolve(JSON.parse(sample))
														response = {
															"result": "valid order "
														}
														console.log(response);

													} else {
														response = {
															"result": "I was not able to find any orders with that number, please try again."


														}
														console.log(response)
														send(req.body.From, response.result, function (response) {
															console.log(response);
														})
													}
												} else {
													response = {
														"result": err
													}
													console.log(err)
													response = "Problem In the API"
													send(req.body.From, response, function (response) {
														console.log(response);
													})
												}

											});
									});
								}

								function user1(args1) {
									return new Promise(function (resolve, reject) {

										unirest.get('http://interfacemss.mybluemix.net/orders/order/invoices?orderId=' + args1)
											.end(function (response, err) {
												if (response.body) {

													console.log(response.body.output[0].invoiceNo);

													var sample = response.body.output[0].invoiceNo;
													resolve(sample);
												} else {
													response = {
														"result": err
													}
													res.json(response);
													response = "Problem In the API"
													send(req.body.From, response, function (response) {
														console.log(response);
													})

												}

											});
									});
								}

								function user2(args2) {
									console.log("argu", args2)
									unirest.get('http://interfacemss.mybluemix.net/invoices/invoice?invoiceNo=' + args2)
										.end(function (response, err) {
											console.log(response.body)
											if (response.body) {
												if (response.body.output) {
													response = "Invoice #" + response.body.output.invoiceData[0].invoiceNo + " " + response.body.output.invoiceData[0].invoiceType + " is for " + response.body.output.product_response[0].totalPrice + "$, and has " + response.body.output.product_response[0].quantity + " items to be shipped on " + response.body.output.product_response[0].shipDate
													var document = cloudant.db.use('interface')
													data.context = response1.context;
													var rev = data.rev_id;
													id = data._id;


													document.insert(data, req.body.From, rev, id, function (err, body, header) {
														if (err) {
															return console.log('[alice.insert] ', err.message);
														}
													});
													send(req.body.From, response, function (response) {
														res.send(response.body);
													});

												} else {
													response = {
														"result": "err"
													}
													res.json(response);
												}

											} else {
												response = {
													"result": "err"
												}
												res.json(response);
												response = "Problem In the API"
												send(req.body.From, response, function (response) {
													console.log(response);
												})
											}


										})
								}
								user().then(function (data) {
									console.log(data);
									user1(data).then(function (data1) {
										console.log(data1);
										user2(data1)
									})
								});

							} else if (response1.intents[0].intent == "Order") {

								function user() {
									return new Promise(function (resolve, reject) {
										unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
											.end(function (response, err) {

												if (response.body.output) {
													var str = response.body.output;
													console.log(str);
													if (str.match("is Valid Order")) {

														var numberPattern = /\d+/g;
														var sample = response.body.output.match(numberPattern)


														console.log(JSON.parse(sample));
														resolve(JSON.parse(sample))
														response = {
															"result": "valid order "
														}
														console.log(response);

													} else {
														response = {
															"result": "I was not able to find any orders with that number, please try again."


														}
														console.log(response)
														send(req.body.From, response.result, function (response) {
															console.log(response);
														})
													}
												} else {
													response = {
														"result": err
													}
													//console.log(err)
													response = "Problem In the API"
													send(req.body.From, response, function (response) {
														console.log(response);
													})
												}

											});
									});
								}

								function user1(args1) {
									console.log(args1);
									unirest.get('http://interfacemss.mybluemix.net/orders/order?orderId=' + args1)
										.end(function (response, err) {
											console.log(response.body);
											if (response.body.output) {
												if (response.body.output) {

													response = "Order #" + response.body.output[0].orderId + " was placed on " + response.body.output[0].orderDate + " for " + response.body.output[0].projectName + " and is curretly " + (response.body.output[0].status).toLowerCase();
													var document = cloudant.db.use('interface')
													data.context = response1.context;
													var rev = data.rev_id;
													id = data._id;


													document.insert(data, req.body.From, rev, id, function (err, body, header) {
														if (err) {
															return console.log('[alice.insert] ', err.message);
														} else {

														}
													});
													send(req.body.From, response, function (response) {
														console.log(response.body);
														res.send(response.body);
													});



												} else {
													response = {
														"result": err
													}
													res.json(response);
												}

											} else {
												response = {
													"result": err
												}
												res.json(response);
												response = "Problem In the API"
												send(req.body.From, response, function (response) {
													console.log(response);
												})
											}


										})




								}
								user().then(function (data) {
									console.log(data);
									user1(data);
								});

							} else {
								fty(req.body.Body, {}, function (response) {

									console.log(response);
									document.insert({
										"context": response.context
									}, req.body.From, function (err, body, header) {

										if (err) {
											return console.log('[alice.insert] ', err.message);
										}



									});

									send(req.body.From, response, function (response) {
										res.send(response.body);

									});
								});
							}

						}


					}
				} //if close
				else if (response1.context.action == "process") {
					console.log("process")

					if (response1.context.cmd == "Order") {
						var response;

						function user() {
							return new Promise(function (resolve, reject) {
								unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
									.end(function (response, err) {
										console.log(response.body);
										if (response.body) {
											//console.log((response.body.output).match("is Valid Order"))
											var str = response.body.output;
											console.log(str);
											if (str.match("is Valid Order")) {
												console.log("inside valid")
												var numberPattern = /\d+/g;
												var sample = response.body.output.match(numberPattern)


												console.log(JSON.parse(sample));
												resolve(JSON.parse(sample))
												response = {
													"result": "valid order "
												}
												console.log(response);

											} else {
												response = {
													"result": "I was not able to find any orders with that number, please try again."
												}
												//console.log(response)
												send(req.body.From, response.result, function (response) {
													console.log(response);
												})
											}
										} else {
											respone = "Problem in the API"
											console.log(err)

											send(req.body.From, response, function (response) {
												//res.send(response.body);

											});

										}

									});
							});
						}

						function user1(args1) {
							console.log(args1);
							unirest.get('http://interfacemss.mybluemix.net/orders/order?orderId=' + args1)
								.end(function (response, err) {
									console.log(response.body);
									if (response.body.output) {
										if (response.body.output) {

											response = "Order #" + response.body.output[0].orderId + " was placed on " + response.body.output[0].orderDate + " for " + response.body.output[0].projectName + " and is curretly " + (response.body.output[0].status).toLowerCase();
											var document = cloudant.db.use('interface')
											data.context = response1.context;
											var rev = data.rev_id;
											id = data._id;


											document.insert(data, req.body.From, rev, id, function (err, body, header) {
												if (err) {
													return console.log('[alice.insert] ', err.message);
												} else {

												}
											});
											send(req.body.From, response, function (response) {
												res.send(response.body)

											});



										} else {
											response = {
												"result": err
											}
											res.json(response);
										}

									} else {
										response = {
											"result": err
										}
										res.json(response);
										response = "Problem In the API"
										send(req.body.From, response, function (response) {
											console.log(response);
										})
									}


								})




						}
						user().then(function (data) {
							console.log(data);
							user1(data);
						});




					} else if (response1.context.cmd == "Claim") {

						console.log("inside claim")

						function user() {

							return new Promise(function (resolve, reject) {
								unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
									.end(function (response, err) {

										if (response.body.output) {

											var str = response.body.output;
											console.log(str);
											if (str.match("is Valid Order")) {

												var numberPattern = /\d+/g;
												var sample = response.body.output.match(numberPattern)


												console.log(JSON.parse(sample));
												resolve(JSON.parse(sample))
												response = {
													"result": "valid order "
												}
												console.log(response);

											} else {
												response = {
													"result": "I was not able to find any orders with that number, please try again."


												}
												//console.log(response)

												send(req.body.From, response.result, function (response) {
													console.log(response);
												})
											}
										} else {
											response = {
												"result": err
											}
											console.log(err)
											response = "Problem In the API"
											send(req.body.From, response, function (response) {
												console.log(response);
											})
										}

									});
							});
						}
						var a = []

						function user1(args1) {
							return new Promise(function (resolve, reject) {

								unirest.get('http://interfacemss.mybluemix.net/orders/order/claims?orderId=' + args1)
									.end(function (response, err) {
										if (response) {

											if (response.body.output.length > 0) {
												a.push({
													"OrderID": response.body.output[0].orderId,
													"Date": response.body.output[0].DateUpdated,
													"Status": response.body.output[0].CaseStatus

												})

												resolve(a)


											} else {
												response = {
													"result": "err"
												}
												res.json(response);

											}

										} else {
											response = {
												"result": "err"
											}
											res.json(response);
											response = "Problem In the API"
											send(req.body.From, response, function (response) {
												console.log(response);
											})
										}


									})
							})
						}

						function user2(args2) {

							console.log(args2[0].Status);
							console.log(args2[0].OrderID)
							unirest.get('http://interfacemss.mybluemix.net/claims/code?code=' + args2[0].Status)
								.end(function (response, err) {
									if (response) {

										console.log(response.body.output);
										if (response) {

											response = "Claim #" + args2[0].OrderID + " is for " + args2[0].Date + " and is currently  " + (response.body.output.Description).toLowerCase()


											var document = cloudant.db.use('interface')
											data.context = response1.context;
											var rev = data.rev_id;
											id = data._id;


											document.insert(data, req.body.From, rev, id, function (err, body, header) {
												if (err) {
													return console.log('[alice.insert] ', err.message);
												}
											});
											send(req.body.From, response, function (response) {
												res.send(response.body)

											});
										} else {
											response = {
												"result": "err"
											}
											res.json(response);

										}

									} else {
										response = {
											"result": "err"
										}
										res.json(response);
										response = "Problem In the API"
										send(req.body.From, response, function (response) {
											console.log(response);
										})
									}


								})





						}

						user().then(function (data) {
							console.log(data);
							user1(data).then(function (data1) {
								console.log(data1);
								user2(data1);
							});
						});

					} else {
						console.log("invoice")
						console.log(response1.context.OrderID)

						function user() {

							return new Promise(function (resolve, reject) {
								unirest.get('http://interfacemss.mybluemix.net/orders/orderId?orderId=' + response1.context.OrderID)
									.end(function (response, err) {
										console.log(response.body.output);
										if (response.body.output) {

											var str = response.body.output;
											console.log(str);
											if (str.match("is Valid Order")) {

												var numberPattern = /\d+/g;
												var sample = response.body.output.match(numberPattern)


												console.log(JSON.parse(sample));
												resolve(JSON.parse(sample))
												response = {
													"result": "valid order "
												}
												console.log(response);

											} else {
												response = {
													"result": "I was not able to find any orders with that number, please try again."


												}
												console.log(response)
												send(req.body.From, response.result, function (response) {
													console.log(response);
												})
											}
										} else {
											response = {
												"result": err
											}
											console.log(err)
										}

									});
							});
						}

						function user1(args1) {
							return new Promise(function (resolve, reject) {

								unirest.get('http://interfacemss.mybluemix.net/orders/order/invoices?orderId=' + args1)
									.end(function (response, err) {
										if (response.body) {

											console.log(response.body.output[0].invoiceNo);

											var sample = response.body.output[0].invoiceNo;
											resolve(sample);
										} else {
											response = {
												"result": err
											}
											res.json(response);

										}

									});
							});
						}

						function user2(args2) {
							console.log("argu", args2)
							unirest.get('http://interfacemss.mybluemix.net/invoices/invoice?invoiceNo=' + args2)
								.end(function (response, err) {
									console.log(response.body)
									if (response.body) {
										if (response.body.output) {
											response = "Invoice #" + response.body.output.invoiceData[0].invoiceNo + " " + response.body.output.invoiceData[0].invoiceType + " is for " + response.body.output.product_response[0].totalPrice + "$, and has " + response.body.output.product_response[0].quantity + " items to be shipped on " + response.body.output.product_response[0].shipDate
											var document = cloudant.db.use('interface')
											data.context = response1.context;
											var rev = data.rev_id;
											id = data._id;


											document.insert(data, req.body.From, rev, id, function (err, body, header) {
												if (err) {
													return console.log('[alice.insert] ', err.message);
												}
											});
											send(req.body.From, response, function (response) {
												res.send(response.body)

											});

										} else {
											response = {
												"result": "err"
											}
											res.json(response);
										}

									} else {
										response = {
											"result": "err"
										}
										res.json(response);
										response = "Problem In the API"
										send(req.body.From, response, function (response) {
											console.log(response);
										})
									}


								})
						}
						user().then(function (data) {
							console.log(data);
							user1(data).then(function (data1) {
								console.log(data1);
								user2(data1)
							})
						});

					}


				} else {
					console.log(response1.output.text[0])
					var document = cloudant.db.use('interface')
					data.context = response1.context;
					var rev = data.rev_id;
					id = data._id;


					document.insert(data, req.body.From, rev, id, function (err, body, header) {
						if (err) {
							return console.log('[alice.insert] ', err.message);
						}
					});
					send(req.body.From, response1.output.text, function (response) {
						//console.log(response.body)
						res.send(response.body);

					});




					console.log(response)
				}
			});
		}
	});

});









var server = app.listen(port, function () {
	console.log('Interface bot  started at localhost:3001');
});


require("cf-deployment-tracker-client").track();