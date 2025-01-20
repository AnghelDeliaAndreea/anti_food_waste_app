import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId, onBack }) => {
    const [user, setUser] = useState(null);
    const [sharedProducts, setSharedProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id : null;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                console.log("No userId provided");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const encodedEmail = encodeURIComponent(userId);
                const userResponse = await fetch(`http://localhost:5000/users/${encodedEmail}`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!userResponse.ok) {
                    throw new Error(`Eroare la obținerea datelor utilizatorului: ${userResponse.status}`);
                }

                const userData = await userResponse.json();
                setUser(userData);

                const productsResponse = await fetch(`http://localhost:5000/users/${encodedEmail}/shared-products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (productsResponse.ok) {
                    setSharedProducts(await productsResponse.json());
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, token]);

    const handleClaim = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/products/${productId}/claim`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                const productsResponse = await fetch(`http://localhost:5000/users/${userId}/shared-products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (productsResponse.ok) {
                    setSharedProducts(await productsResponse.json());
                }
            } else {
                alert(data.message || 'Eroare la revendicarea produsului.');
            }
        } catch (error) {
            console.error('Eroare la revendicarea produsului:', error);
            alert('A apărut o problemă. Te rugăm să încerci din nou.');
        }
    };

    if (loading) {
        return <div>Se încarcă profilul...</div>;
    }

    if (error) {
        return <div>Eroare: {error}</div>;
    }

    if (!user) {
        return <div>Utilizatorul nu a fost găsit.</div>;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Profilul lui {user.nume}</h2>
                <p>Email: {user.email}</p>

                <h3>Produse disponibile:</h3>
                {sharedProducts.length > 0 ? (
                    <ul>
                        {sharedProducts.map((product) => (
                            <li key={product.id}>
                                {product.denumire} - {product.categorie} - {product.data_expirare}
                                {product.is_claimed && product.claimed_by && <p>Revendicat de: {product.claimed_by}</p>}
                                {!product.is_claimed && product.id_client !== currentUserId && (
                                    <button onClick={() => handleClaim(product.id)}>Revendică</button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Acest utilizator nu a partajat niciun produs momentan.</p>
                )}
                <button onClick={onBack} className="close-button">Înapoi la lista de membri</button>
            </div>
        </div>
    );
};

export default UserProfile;
