import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';


function App() {
  const [products, setProducts] = useState([]);
  const [nume, setNume] = useState('');
  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', expirationDate: '' });
  const [editProduct, setEditProduct] = useState(null);
  const [produseDisponibile, setProduseDisponibile] = useState([]); // produse care expiră în 0-2 zile
  const [produseNormale, setProduseNormale] = useState([]); // produse care expiră după 2 zile
  const [produseExpirate, setProduseExpirate] = useState([]); // produse expirate
  const [sharedProducts, setSharedProducts] = useState([]);
  const [showMembersList, setShowMembersList] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);

  //pentru gestionarea grupurilor
  const [groups, setGroups] = useState([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', label: '' });
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  //pentru produsele din grupurile de prieteni
  const [groupAvailableProducts, setGroupAvailableProducts] = useState([]);
  const [selectedGroupForProducts, setSelectedGroupForProducts] = useState(null);
  const [showGroupProducts, setShowGroupProducts] = useState(false);

  //pentru trimitere invitatii
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  //pentru primire invitatii
  const [invitations, setInvitations] = useState([]);

  //pentru vizitare profil utilizator
  const [viewingUserId, setViewingUserId] = useState(null); // State pentru ID-ul utilizatorului vizualizat
  const [selectedUserId, setSelectedUserId] = useState(null);



  const registerUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nume, email, parola }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Înregistrare reușită! Acum te poți loga.');
        setIsLogin(true);
      } else {
        alert('Eroare la înregistrare: ' + data.message);
      }
    } catch (error) {
      console.error('Eroare la înregistrare:', error);
      alert('A apărut o problemă. Te rugăm să încerci din nou.');
    }
  };

  const loginUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, parola }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Token primit:', data.token); // adăugat pentru debug
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        fetchProducts();
        fetchGroups();
      } else {
        alert('Autentificare eșuată: ' + data.message);
      }
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      alert('A apărut o problemă. Te rugăm să încerci din nou.');
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setProducts([]);
    setNume('');
    setEmail('');
    setParola('');
  };

  const categorizeazaProduse = (produse) => {
    const acum = new Date();
    const peste2Zile = new Date();
    peste2Zile.setDate(acum.getDate() + 2);

    const disponibile = [];
    const normale = [];
    const expirate = [];

    produse.forEach(produs => {
      const dataExpirare = new Date(produs.data_expirare);

      if (dataExpirare < acum) {
        expirate.push(produs);
      } else if (dataExpirare <= peste2Zile && produs.disponibil==1) {
        // Adăugăm în disponibile doar dacă disponibil este true
        disponibile.push(produs);
      } else if (dataExpirare <= acum && produs.disponibil==0) {
        // Dacă nu e disponibil dar expiră în 2 zile, îl punem la normale
        normale.push(produs);
      } else {
        normale.push(produs);
      }
    });

    setProduseDisponibile(disponibile);
    setProduseNormale(normale);
    setProduseExpirate(expirate);
    setProducts(produse);
};
  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        alert('Acces neautorizat! Te rugăm să te autentifici din nou.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        return;
      }

      const data = await response.json();
      //setProducts(data);
      categorizeazaProduse(data);
    } catch (error) {
      console.error('Eroare la obținerea produselor:', error);
      alert('A apărut o problemă la obținerea produselor.');
    }
  };

  const addProduct = async () => {
    const token = localStorage.getItem('token');
    const userID = JSON.parse(atob(token.split('.')[1])).id; //am luat id-ul de la utilizator

    const productData = {
      denumire: newProduct.name,
      categorie: newProduct.category,
      data_expirare: newProduct.expirationDate,
      id_client: userID
    }

    try {
      const response = await fetch('http://localhost:5000/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert('Produs adaugat cu succes!');
        fetchProducts();
        setShowAddProduct(false);
      }
      else {
        alert('Eroare la adaugarea produsului');
      }
    } catch (error) {
      console.error('Eroare la adaugarea produsului:', error);
      alert('A aparut o eroare. Incearca din nou!');
    }
  };

  const handleDelete = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Te rugăm să te autentifici pentru a șterge un produs.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchProducts(); // Reîmprospătăm lista de produse
      } else {
        alert(data.message || 'Eroare la ștergerea produsului');
      }
    } catch (error) {
      console.error('Eroare la ștergerea produsului:', error);
      alert('A apărut o problemă la ștergerea produsului. Te rugăm să încerci din nou.');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setNewProduct({
      denumire: product.denumire,
      categorie: product.categorie,
      data_expirare: product.data_expirare,
    });
    setShowAddProduct(true);
  };

  //functie edit produs trimite backend
  const editProductData = async () => {
    const token = localStorage.getItem('token');
    const userID = JSON.parse(atob(token.split('.')[1])).id;  // Am luat ID-ul de la utilizator

    const productData = {
      denumire: newProduct.denumire,
      categorie: newProduct.categorie,
      data_expirare: newProduct.data_expirare,
      id_client: userID,
    };

    try {
      const response = await fetch(`http://localhost:5000/products/${editProduct.id}`, {
        method: 'PUT',  // Sau 'PATCH', în funcție de backend
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert('Produs modificat cu succes!');
        fetchProducts();  // Actualizăm lista de produse
        setShowAddProduct(false);  // Ascundem formularul
        setEditProduct(null);  // Resetăm produsul editat
      } else {
        alert('Eroare la modificarea produsului.');
      }
    } catch (error) {
      console.error('Eroare la modificarea produsului:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };


  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchProducts();
      fetchGroups();
      fetchInvitations();
    }
  }, []);

  const markAsAvailable = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
  
    try {
      const response = await fetch(`http://localhost:5000/products/${productId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Produsul a fost marcat ca disponibil!');
        fetchProducts();
      } else {
        alert(`Eroare la marcarea produsului ca disponibil: ${data.message}`);
      }
    } catch (error) {
      console.error('Eroare completă:', error);
      alert('A apărut o problemă. Te rugăm să încerci din nou.');
    }
  };
  

  // Funcție pentru verificarea produselor care expiră în 2 zile
  const checkExpiringProducts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/products/expiring', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProduseDisponibile(data.available);
        setProduseExpirate(data.expired);

        // Notificări îmbunătățite
        if (data.available.length > 0) {
          const notification = `${data.available.length} produse expiră în maxim 2 zile! Dorești să le marchezi ca disponibile pentru alți utilizatori?`;
          if (window.confirm(notification)) {
            // Marcăm toate produsele ca disponibile
            for (const produs of data.available) {
              await markAsAvailable(produs.id);
            }
          }
        }
        if (data.expired.length > 0) {
          alert(`${data.expired.length} produse au expirat!`);
        }
      }
    } catch (error) {
      console.error('Eroare la verificarea produselor:', error);
    }
  };


  // Verificăm produsele la intervale regulate
  useEffect(() => {
    if (isAuthenticated) {
      checkExpiringProducts();
      const interval = setInterval(checkExpiringProducts, 12 * 60 * 60 * 1000); // Verificăm la fiecare 12 ore
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Funcție pentru crearea unui grup nou
  const createGroup = async () => {
    try {
      const response = await fetch('http://localhost:5000/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          nume_grup: newGroup.name,  // modificat pentru a se potrivi cu backend-ul
          eticheta: newGroup.label
        }),
      });

      const data = await response.json();
      if (data.success) {  // verificăm success din răspunsul backend-ului
        alert('Grup creat cu succes!');
        fetchGroups();
        setShowAddGroup(false);
        setNewGroup({ name: '', label: '' });
      } else {
        alert(data.message || 'Eroare la crearea grupului');
      }
    } catch (error) {
      console.error('Eroare la crearea grupului:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };

  // Funcție pentru obținerea grupurilor
  const fetchGroups = async () => {
    const token = localStorage.getItem('token');
    console.log('Token din localStorage:', token); // verifică dacă token-ul există

    if (!token) {
      console.log('Nu există token');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Status răspuns:', response.status);

      if (response.status === 403) {
        // Token invalid - delogăm utilizatorul
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Date primite de la server:', data);

        const mappedGroups = Array.isArray(data) ? data : (data.groups || []);
        console.log('Grupuri mapate:', mappedGroups);

        setGroups(mappedGroups);
      } else {
        const errorText = await response.text();
        console.error('Eroare răspuns:', errorText);
      }
    } catch (error) {
      console.error('Eroare la obținerea grupurilor:', error);
    }
  };

  // Funcție pentru adăugarea unui membru în grup
  const addMemberToGroup = async () => {
    try {
      const response = await fetch(`http://localhost:5000/groups/${selectedGroup}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email: memberEmail }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Membru adăugat cu succes!');
        setShowAddMember(false);
        setMemberEmail('');
        fetchGroupMembers(selectedGroup);
        // Nu mai apelăm fetchGroups()
        // în schimb, actualizăm doar grupul curent în state
        const currentGroup = groups.find(g => g.id === selectedGroup);
        if (currentGroup) {
          const updatedGroups = groups.map(group => {
            if (group.id === selectedGroup) {
              return {
                ...group,
                // Adăugăm noul membru la lista existentă
                members: [...(group.members || []), { email: memberEmail }]
              };
            }
            return group;
          });
          setGroups(updatedGroups);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Eroare la adăugarea membrului:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };
  //functia pentru obtinerea membrilor
  const fetchGroupMembers = async (groupId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/groups/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedGroupMembers(data);
        setShowMembersList(true);
        setSelectedGroupForMembers(groupId);
      } else {
        alert('Eroare la obținerea membrilor');
      }
    } catch (error) {
      console.error('Eroare la obținerea membrilor:', error);
    }
  };
  const deleteGroup = async (groupId) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest grup?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Grupul a fost șters cu succes!');
        fetchGroups(); // Reîmprospătăm lista de grupuri
      } else {
        alert(data.message || 'Eroare la ștergerea grupului');
      }
    } catch (error) {
      console.error('Eroare la ștergerea grupului:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };

  //aici stergem cate un prieten din grup
  const deleteMember = async (groupId, memberEmail) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/groups/${groupId}/members/${memberEmail}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        alert('Membru șters cu succes!');
        // Actualizăm lista de membri direct în state pentru a evita un nou fetch
        const updatedMembers = selectedGroupMembers.filter(member => member.email !== memberEmail);
        setSelectedGroupMembers(updatedMembers);
      } else {
        alert(data.message || 'Eroare la ștergerea membrului');
      }
    } catch (error) {
      console.error('Eroare la ștergerea membrului:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };
  //luam produsele din grup
  const fetchGroupAvailableProducts = async (groupId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/groups/${groupId}/available-products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroupAvailableProducts(data);
        setShowGroupProducts(true);
        setSelectedGroupForProducts(groupId);
      } else {
        alert('Eroare la obținerea produselor disponibile');
      }
    } catch (error) {
      console.error('Eroare:', error);
    }
  };

//INVITATII
const sendInvitations = async (groupId, emailsString) => {
  const token = localStorage.getItem('token');

  // Asigură-te că emailsString este separat corect în array
  const emails = emailsString.split(',').map(email => email.trim());

  console.log('Emails to send:', emails); // Verifică dacă emails este un array

  try {
    const response = await fetch(`http://localhost:5000/groups/${groupId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ emails }) // Asigură-te că emails este un array
    });
    const responseText = await response.text();
    console.log('Response text:', responseText);
    const data = JSON.parse(responseText);

    if (data.success) {
      setInviteMessage('Invitațiile au fost trimise cu succes!');
    } else {
      setInviteMessage(`Eroare: ${data.message}`);
    }
  } catch (error) {
    setInviteMessage(`Eroare la trimiterea invitațiilor: ${error.message}`);
  }
};

  const InviteForm = ({ groupId, onClose }) => {
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendInvitations = async (groupId, emails) => {
      const token = localStorage.getItem('token');
      console.log('Emails to send:', emails); // Verifică dacă emails este un array
    
      try {
        const response = await fetch(`http://localhost:5000/groups/${groupId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ emails }) // Asigură-te că emails este un array
        });
        const responseText = await response.text();
        console.log('Response text:', responseText);
        const data = JSON.parse(responseText);
    
        if (data.success) {
          setInviteMessage('Invitațiile au fost trimise cu succes!');
        } else {
          setInviteMessage(`Eroare: ${data.message}`);
        }
      } catch (error) {
        setInviteMessage(`Eroare la trimiterea invitațiilor: ${error.message}`);
      }
    };
    
  }
  //PRIMIRE INVITATII
  const fetchInvitations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/invitations', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      } else {
        console.error('Eroare la preluarea invitațiilor:', response.statusText);
      }
    } catch (error) {
      console.error('Eroare la preluarea invitațiilor:', error);
    }
  };

  const handleInvitation = async (invitationId, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }) // status poate fi 'accepted' sau 'rejected'
      });

      if (response.ok) {
        alert(status === 'accepted' ? 'Invitație acceptată!' : 'Invitație respinsă!');
        fetchInvitations(); // Reîmprospătăm lista de invitații
        if (status === 'accepted') {
          fetchGroups(); // Reîmprospătăm lista de grupuri dacă invitația a fost acceptată
        }
      } else {
        const data = await response.json();
        alert(data.message || 'Eroare la procesarea invitației');
      }
    } catch (error) {
      console.error('Eroare la procesarea invitației:', error);
      alert('A apărut o eroare. Încercați din nou!');
    }
  };
  const handleMemberClick = (userId) => {
    setSelectedUserId(userId);
    setShowMembersList(false); // Ascundem lista când se deschide profilul
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setShowMembersList(false);
  };

  const handleBackToMembers = () => {
    setSelectedUserId(null);
    setShowMembersList(true);
  };

  const MembersList = () => {
    if (!showMembersList) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Membrii grupului</h2>
          <div className="members-list">
            {selectedGroupMembers.map((member) => (
              <div
                key={member.email}
                className="member-item"
                onClick={() => handleMemberClick(member.email)}
                style={{
                  cursor: 'pointer',
                  padding: '10px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <span>{member.email}</span>
                <span>{member.nume}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowMembersList(false)}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Închide
          </button>
        </div>
      </div>
    );
  };

  const handleUserClick = (userId) => {
    console.log("Clicking user:", userId);
    setSelectedUserId(userId);
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <div>
          <h1>{isLogin ? 'Login' : 'Register'}</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isLogin ? loginUser() : registerUser();
            }}
          >
            {!isLogin && (
              <div>
                <label>
                  Nume:
                  <input
                    type="text"
                    value={nume}
                    onChange={(e) => setNume(e.target.value)}
                    required
                  />
                </label>
              </div>)}
            <div>
              <label>
                Email:
                <input type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required />
              </label>
            </div>
            <div>
              <label>
                Parola:
                <input type="password"
                  value={parola}
                  onChange={(e) => setParola(e.target.value)}
                  required />
              </label>
            </div>
            <button type="submit">
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
          <button onClick={toggleForm}>
            {isLogin ? 'Nu ai cont? Creează unul!' : 'Ai deja cont? Intră pe contul tău!'}
          </button>
        </div>) : (<div>
          {isAuthenticated &&
            (<button className="logout-button"
              onClick={logoutUser}> Ieși din cont </button>)}
          <h1>Frigiderul Meu</h1>
          <button onClick={() => setShowAddProduct(true)}>
            Adaugă produs</button>
          {/* Formular pentru adăugare/editare produs */}
          {showAddProduct && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editProduct) { editProductData(); }
              else { addProduct(); }
            }} >
              <div>
                <label> Nume produs:
                  <input type="text"
                    value={editProduct ? newProduct.denumire : newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, [editProduct ? 'denumire' : 'name']: e.target.value })}
                    required />
                </label>
              </div>
              <div>
                <label> Categorie:
                  <input type="text"
                    value={editProduct ? newProduct.categorie : newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, [editProduct ? 'categorie' : 'category']: e.target.value })}
                    required />
                </label>
              </div>
              <div>
                <label> Data expirării:
                  <input type="date"
                    value={editProduct ? newProduct.data_expirare : newProduct.expirationDate}
                    onChange={(e) => setNewProduct({ ...newProduct, [editProduct ? 'data_expirare' : 'expirationDate']: e.target.value })}
                    required />
                </label>
              </div>
              <button type="submit">
                {editProduct ? 'Salvează modificări' : 'Adaugă produs'}
              </button> <button type="button"
                onClick={() => {
                  setShowAddProduct(false);
                  setEditProduct(null);
                  setNewProduct({ name: '', category: '', expirationDate: '' });
                }}> Anulează </button> </form>)}
          {/* Afișarea produselor pe categorii */}
          <div className="products-container">
            {/* Secțiunea pentru produse normale */}
            {produseNormale.length > 0 &&
              (<div className="normal-products-section">
                <h2>Produse Normale</h2>
                <ul className="products-list">
                  {produseNormale.map((produs) =>
                  (<li key={produs.id} className="product-item normal">
                    <h3>{produs.denumire}</h3>
                    <p>Categorie: {produs.categorie}</p>
                    <p>Data expirării: {produs.data_expirare}</p>
                    <div className="product-actions">
                      <button onClick={() => handleEdit(produs)}>
                        Modifică</button>
                      <button onClick={() => markAsAvailable(produs.id)}>
                        Marchează disponibil</button>
                      <button onClick={() => handleDelete(produs.id)} className="delete-button">Șterge</button>
                    </div>
                  </li>
                  ))}
                </ul>
              </div>
              )}
            {/* Secțiunea pentru produse disponibile */}
            {produseDisponibile.length > 0 && (
              <div className="available-products-section">
                <h2>Produse Disponibile (Expiră în maxim 2 zile)</h2>
                <ul className="products-list">
                  {produseDisponibile.map((produs) => (
                    <li key={produs.id} className="product-item available">
                      <h3>{produs.denumire}</h3>
                      <p>Categorie: {produs.categorie}</p>
                      <p>Data expirării: {produs.data_expirare}</p>
                      <div className="product-actions">
                        <button onClick={() => handleEdit(produs)}>Modifică</button>
                        <button onClick={() => handleDelete(produs.id)}>Șterge</button>
                        
                        {produs.isShared && (
                          <span className="shared-badge">
                            Marcat ca disponibil
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Secțiunea pentru produse expirate */}
            {produseExpirate.length > 0 &&
              (<div className="expired-products-section">
                <h2>Produse Expirate</h2>
                <ul className="products-list">
                  {produseExpirate.map((produs) =>
                  (<li key={produs.id} className="product-item expired">
                    <h3>{produs.denumire}</h3>
                    <p>Categorie: {produs.categorie}</p>
                    <p>Data expirării: {produs.data_expirare}</p>
                    <div className="product-actions">
                      <button onClick={() => handleDelete(produs.id)} className="delete-button">
                        Șterge</button>
                    </div>
                  </li>
                  ))}
                </ul>
              </div>
              )}
            {/* Secțiunea pentru grupuri */}
            <div className="groups-section">
              <h2>Grupurile Mele</h2>
              <button onClick={() => setShowAddGroup(true)}>
                Creează Grup Nou</button>
              <div className="groups-list">
                {groups.map((group) => (
                  <div key={group.id} className="group-item">
                    <h3>{group.nume_grup}</h3>
                    <p>Etichetă: {group.eticheta}</p>
                    <div className="group-actions">
                      <button onClick={() => {
                        setSelectedGroup(group.id);
                        setShowAddMember(true);
                      }}>
                        Adaugă Membru </button>
                      <button onClick={() => fetchGroupMembers(group.id)}> Afișează Lista Membri </button>
                      <button onClick={() => fetchGroupAvailableProducts(group.id)}> Vezi Produse Disponibile </button>
                      <button onClick={() => {
                        setSelectedGroup(group.id);
                        setShowInviteForm(true);
                      }}> Invită Prieteni </button>
                      <button onClick={() => deleteGroup(group.id)} className="delete-member-button"> Șterge Grup </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Modal pentru adăugare grup */}
            {showAddGroup && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Grup Nou</h3>
                  <input type="text" placeholder="Nume grup" value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })} />
                  <input type="text" placeholder="Etichetă (ex: vegetarieni)" value={newGroup.label}
                    onChange={(e) => setNewGroup({ ...newGroup, label: e.target.value })} />
                  <button onClick={createGroup}>Creează</button> <button onClick={() =>
                    setShowAddGroup(false)}>Anulează</button>
                </div>
              </div>
            )}

            {/* Modal pentru adăugare membru */}
            {showAddMember && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Adaugă Membru Nou</h3>
                  <input type="email"
                    placeholder="Email-ul membrului"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full p-2 mb-4 border rounded" />
                  <div className="button-group"> <button onClick={() => {
                    addMemberToGroup();
                    setShowAddMember(false);
                  }} className="bg-blue-500 text-white px-4 py-2 rounded mr-2" > Adaugă </button>
                    <button onClick={() => {
                      setShowAddMember(false);
                      setMemberEmail('');
                    }} className="delete-member-button" > Anulează </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal pentru lista de membri și profil utilizator */}
            {showMembersList && (
              <div className="modal-overlay">
                <div className="modal-content">
                  {!selectedUserId ? (<>
                    <h3>Lista Membri</h3>
                    <div className="members-list">
                      {selectedGroupMembers.map((member) => (
                        <button key={member.email}
                          className='member-button'
                          onClick={() => handleUserClick(member.email)} >
                          {member.email} </button>))}
                    </div>
                    <button onClick={() => {
                      setShowMembersList(false);
                      setSelectedGroupMembers([]);
                      setSelectedGroupForMembers(null);
                    }}
                      className='delete-member-button' >
                      Închide </button>
                  </>) : (
                    <UserProfile userId={selectedUserId} onBack={() => {
                      console.log("Going back"); setSelectedUserId(null);

                    }} fetchProducts={fetchProducts} />
                  )}
                </div>
              </div>
            )}

            {/* Modal pentru produse disponibile în grup */}
            {showGroupProducts && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Produse Disponibile în Grup</h3>
                  <div className="available-products-list">
                    {groupAvailableProducts.length > 0 ? (
                      groupAvailableProducts.map((product) => (
                        <div key={product.id} className="product-item">
                          <h4>{product.denumire}</h4>
                          <p>Categorie: {product.categorie}</p>
                          <p>Data expirării: {product.data_expirare}</p>
                          <p>Oferit de: {product.email_utilizator}</p>
                        </div>
                      ))
                    ) : (
                      <p>Nu există produse disponibile în acest grup momentan.</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowGroupProducts(false);
                      setGroupAvailableProducts([]);
                      setSelectedGroupForProducts(null);
                    }}
                    className="close-button"
                  >
                    Închide
                  </button>
                </div>
              </div>
            )}

            {/* Modal pentru invitații */}
            {showInviteForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Invită Prieteni</h3>
                  <div>
                    <label>
                      Emailuri (separate prin virgulă):
                    </label>
                    <textarea
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="ex: prieten@email.com, altprieten@email.com"
                      className="w-full p-2 mb-4 border rounded"
                      rows={4}
                      disabled={isLoading}
                    />
                    {inviteMessage && (
                      <div className={`p-3 rounded ${inviteMessage.includes('succes')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {inviteMessage}
                      </div>
                    )}
                    <div className="button-group">
                      <button
                        onClick={() => sendInvitations(selectedGroup, inviteEmails)}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                        disabled={isLoading || !inviteEmails.trim()}
                      >
                        {isLoading ? 'Se trimite...' : 'Trimite Invitații'}
                      </button>
                      <button
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmails('');
                          setInviteMessage('');
                        }}
                        className="delete-member-button"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Secțiunea pentru invitații primite */}
            <div className="invitations-section">
              <h2>Invitații Primite</h2>
              {invitations.length > 0 ? (
                <div className="invitations-list">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="invitation-item">
                      <p>Ai fost invitat în grupul: {invitation.group_name}</p>
                      <p>De către: {invitation.sender_email}</p>
                      <div className="invitation-actions">
                        <button
                          onClick={() => handleInvitation(invitation.id, 'accepted')}
                          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                          Acceptă
                        </button>
                        <button
                          onClick={() => handleInvitation(invitation.id, 'rejected')}
                          className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                          Respinge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nu ai invitații noi</p>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
export default App;