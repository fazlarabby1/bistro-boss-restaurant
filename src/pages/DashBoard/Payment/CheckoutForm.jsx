import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useEffect } from "react";
import useAuth from "../../../hooks/useAuth";

const CheckoutForm = ({ price }) => {
    const axiosSecure = useAxiosSecure();
    const { user } = useAuth();
    const stripe = useStripe();
    const elements = useElements();
    const [cardError, setCardError] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);

    useEffect(() => {
        axiosSecure.post('/create-payment-intent', { price })
            .then(res => {
                console.log(res.data.clientSecret);
                setClientSecret(res.data.clientSecret);
            })
    }, [axiosSecure, price]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const card = elements.getElement(CardElement)
        if (card === null) {
            return;
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card,
        });

        if (error) {
            console.log('error', error);
            setCardError(error);
        }
        else {
            setCardError(null)
            console.log(paymentMethod.created);
        }

        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            {
                payment_method: {
                    card: card,
                    billing_details: {
                        name: user?.displayName || 'anonymous',
                        email: user?.email
                    },
                },
            },
        );

        if (confirmError) {
            console.log(confirmError);
        }
        console.log(paymentIntent);
    };

    return (
        <>
            <h1 className="text-xl font-semibold mb-4">You have to pay: {price}$</h1>
            <form onSubmit={handleSubmit}>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
                {
                    cardError && <p className='text-red-700 mt-2'>{cardError?.message}</p>
                }
                <div>
                    <button className="btn btn-info rounded-md btn-sm mt-7" type="submit" disabled={!stripe || !clientSecret}>
                        Pay
                    </button>
                </div>
            </form>
        </>
    );
};

export default CheckoutForm;