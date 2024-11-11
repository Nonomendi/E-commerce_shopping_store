const domainName = "http://localhost:5000";
let userID = getSession();

async function deleteProduct() {
    const productId = new URLSearchParams(window.location.search).get("id");

    await fetch(`${domainName}/remove-products`, {
        method: 'POST',
        headers: { 'Accept': "application/json" },
        body: JSON.stringify([productId])
    });

    window.location.replace("./index.html");
}

async function deleteProducts() {
    const selectedProducts = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(checkbox => checkbox.value);

    await fetch(`${domainName}/remove-products`, {
        method: 'POST',
        headers: { 'Accept': "application/json" },
        body: JSON.stringify(selectedProducts)
    });

    window.location.replace("./index.html");
}

function editFormView() {
    const productId = new URLSearchParams(window.location.search).get("id");

    document.getElementById("item_update").innerHTML = `
        <form action="product_update.html" id="update_item">
            <label for="update_name"></label>
            <input id="update_name" type="text" name="update_name" placeholder="Enter product name" required><br/>
            <label for="update_desc"></label>
            <input id="update_desc" type="text" name="update_desc" placeholder="Enter product description" required><br/>
            <label for="update_price"></label>
            <input id="update_price" type="text" name="update_price" placeholder="Enter product price (omit currency sign)" required><br/>
            <input type="hidden" name="id" value="${productId}">
            <input type="submit" value="Update product">
        </form>`;
}

async function viewProduct() {
    const productId = new URLSearchParams(window.location.search).get("id");

    try {
        const response = await fetch(`${domainName}/product/${productId}`, {
            method: 'GET',
            headers: { 'Accept': "application/json" }
        });
        const data = await response.json();
        document.getElementById("item-name").innerText = data.name;
        document.getElementById("item-description").innerText = data.description;
        document.getElementById("item-price").innerText = `R ${data.price}`;
    } catch (error) {
        console.error("Error fetching product details:", error);
    }
}

async function updateProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const updatedProduct = {
        id: urlParams.get("id"),
        name: urlParams.get("update_name"),
        description: urlParams.get("update_desc"),
        price: +urlParams.get("update_price")
    };

    await fetch(`${domainName}/product/${updatedProduct.id}`, {
        method: "PUT",
        headers: { 'Accept': "application/json" },
        body: JSON.stringify(updatedProduct)
    }).then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error("Error updating product:", error));
}

async function openStore() {
    try {
        const response = await fetch(`${domainName}/products`, {
            method: 'POST',
            headers: { 'Accept': "application/json" }
        });
        const data = await response.json();

        if (data.length <= 0) {
            document.getElementById("results").innerText = "There are currently no items/products available for purchase";
        } else {
            displayResults(data);
        }
    } catch (error) {
        console.error("Error opening store:", error);
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    let table = document.createElement("table");

    // Table Headings
    const headings = ["Item", "Description", "Price", "Delete", "Add to cart"].map(text => {
        const th = document.createElement('th');
        th.textContent = text;
        return th;
    });

    const headingRow = document.createElement('tr');
    headings.forEach(heading => headingRow.appendChild(heading));
    table.appendChild(headingRow);

    data.forEach(item => {
        const product = JSON.parse(item);
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><a href="./product.html?id=${product.id}">${product.name}</a></td>
            <td>${product.description}</td>
            <td>R${product.price}</td>
            <td><input type="checkbox" value="${product.id}"></td>
            <td><input type="submit" id="${product.id}" value="Add to cart"></td>
        `;

        row.querySelector(`input[type=submit]`).onclick = addToCart;
        table.appendChild(row);
    });

    resultsContainer.appendChild(table);
}

async function addProduct() {
    const form = document.getElementById("product_add_form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const product = {
            name: document.getElementById("product_name").value,
            description: document.getElementById("product_desc").value,
            price: document.getElementById("product_price").value
        };

        try {
            const response = await fetch(`${domainName}/product`, {
                method: 'POST',
                headers: { 'Accept': "application/json" },
                body: JSON.stringify(product)
            });
            const data = await response.json();

            if (data.code === "BAD_REQUEST") {
                alert(`${data.message} - invalid data entry`);
            } else {
                window.location.replace("./index.html");
            }
        } catch (error) {
            console.error("Error adding product:", error);
        }
    });
}

async function addToCart(e) {
    if (!userID) {
        alert("You need to be logged in to perform this action");
        return;
    }

    await fetch(`${domainName}/order`, {
        method: 'POST',
        headers: { 'Accept': "application/json" },
        body: JSON.stringify({ customerId: userID, products: e.target.id })
    }).catch(error => console.error("Error adding to cart:", error));
}

async function getActiveOrder() {
    try {
        const response = await fetch(`${domainName}/orders`, {
            method: 'POST',
            headers: { 'Accept': "application/json" },
            body: JSON.stringify({ customerId: userID })
        });
        const data = await response.json();

        document.getElementById("basket").append(await productListTable(data));

        const payment = document.getElementById("payment");
        payment.innerHTML = `
            <form action="./checkout.html" method="post" id="make_payment">
                <input type="hidden" value="${data.total}" name="amount">
                <input type="hidden" value="${data.id}" name="order_id">
                <input type="submit" value="Pay R ${data.total} now">
            </form>
        `;

        document.getElementById("make_payment").addEventListener("submit", async function(evt) {
            evt.preventDefault();
            data.paid = true;

            try {
                const updateResponse = await fetch(`${domainName}/order/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Accept': "application/json" },
                    body: JSON.stringify(data)
                });
                const updateData = await updateResponse.json();

                if (updateData.paid) {
                    window.location.replace(`./checkout.html?id=${data.id}`);
                } else {
                    payment.innerHTML = `<a href='./checkout.html?id=${data.id}'>Click here</a> to go to order confirmation.`;
                }
            } catch (error) {
                console.error("Error completing payment:", error);
            }
        });
    } catch (error) {
        console.error("Error fetching active order:", error);
    }
}

async function loginPage() {
    if (userID) {
        document.getElementById("login_form").innerHTML = `
            <div style="color: blue; cursor: pointer" onclick="deleteAccount()">Delete account</div><br/>
            <div style="color: blue; cursor: pointer" onclick="signOut()">Log out</div>`;
    } else {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.size === 2) {
            try {
                const response = await fetch(`${domainName}/customer`, {
                    method: 'POST',
                    headers: { 'Accept': "application/json" },
                    body: JSON.stringify({
                        name: urlParams.get("name"),
                        email: urlParams.get("email")
                    })
                });
                const data = await response.json();

                if (data.code === "BAD_REQUEST") {
                    alert("The email address is already in use by another user.");
                    window.location.replace("./login.html");
                } else {
                    setSession(data.id);
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error during login:", error);
            }
        }
    }
}

async function deleteAccount() {
    await fetch(`${domainName}/customer/${userID}`, { method: 'DELETE' });
    signOut();
}

function signOut() {
    userID = null;
    localStorage.removeItem("userId");
    window.location.replace("./index.html");
}

function setSession(id) {
    userID = id;
    localStorage.setItem("userId", id);
}

function getSession() {
    return localStorage.getItem("userId");
}
