import { getCustomerByEmail } from 'lib/stripe/getCustomerByEmail';

const email = 'mattwad+customer@gmail.com';

async function testStripe() {
  console.log(await getCustomerByEmail(email));
}

testStripe();
