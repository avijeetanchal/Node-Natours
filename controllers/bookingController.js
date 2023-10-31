const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const User = require('./../models/UserModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1)) get the currenlty booked tour
  const tour = await Tour.findById(req.params.tourId);

  //  2)) create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],

    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,

    success_url: `${req.protocol}://${req.get('host')}/my-tours`,

    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    // payment success we get access to session object again
    client_reference_id: req.params.tourId,
    line_items: [
      {
        // objects defined by stripe
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // need to change at production
        price: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) send it to client side

  res.status(200).json({
    status: 'seccuss',
    session,
  });
});

// not needed after deployment -> use webhook
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this i temporary process as it is unsecure
//   // everyone can make booking iwhtout paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.orginalUrl.split('?')[0]);
// });
const checkoutFunc = async (session) => {
  await Booking.create({
    tour: session.client_reference_id,
    user: (await User.findOne({ email: session.customer_email })).id,
    price: session.line_items[0].amount / 100,
  });
};

// runs this middle ware in case of successsful payment
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature']; // added by stripe for webhook
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      'webhook secrect available in strip website', // config.env
    );
  } catch (err) {
    return res.status(400).send(`webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    checkoutFunc(event.data.object);

    res.status(200).json({ received: true });
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
