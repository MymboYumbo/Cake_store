// When I wrote this, only God and I understood what I was doing.
// Well, now God only knows.

// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".cards");

// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      let result = await fetch("products.json");
      let data = await result.json();

      let products = data.items;
      products = products.map((item) => {
        const { title, type, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, type, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}
// display products
class UI{
  displayProducts(products) {
    let result ='';
    products.forEach((product) => {
      result += `
      <div class="card">
        <div class="img-container ${product.type}">  
          <img
            class="itemImage"
            src=${product.image}
            alt="${product.title}"
          />
           <button class="bag-btn" data-id=${product.id}>
            <i class="fas fa-shopping-cart"></i>
            add to cart
          </button>
        </div>
        <div class="itemName">
          <p>${product.title}</p>
          <p>$${product.price}</p>
        </div>
      </div>
      `;
    });
    productsDOM.innerHTML = result;
  }
//values from the sortProductByType function/event listener
  filterItems(sortType,products){
    if (sortType === "view all"){
      this.displayProducts(products)
    }else {
      let filteredProducts = products.filter(products => (products.type === sortType))
      this.displayProducts(filteredProducts)
    }
  }
 
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;
        // get product from products
        let cartItem = { ...Storage.getProduct(id), amount: 1 };
        // add product to the cart
        cart = [...cart, cartItem];
        // save cart in local storage
        Storage.saveCart(cart);
        // set cart values
        this.setCartValues(cart);
        // display cart item
        this.addCartItem(cartItem);
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
    <img src=${item.image} 
    alt="product"/>
    <div>
      <h4>${item.title}</h4>
      <h5>$${item.price}</h5>
      <span class="remove-item" data-id=${item.id}>remove</span>
    </div>
    <div>
      <i class="fas fa-chevron-up" <span class="remove-item" data-id=${item.id}></span></i>
      <p class="item-amount">${item.amount}</p>
      <i class="fas fa-chevron-down" <span class="remove-item" data-id=${item.id}></span></i>
    </div>`;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }
  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }
  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }
  cartLogic() {
    // clear cart button
    clearCartBtn.addEventListener('click', () => {
      this.clearCart();
    });
    // cart functionality
    cartContent.addEventListener('click', event => {
      if (event.target.classList.contains('remove-item')) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains('fa-chevron-up')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      }else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
    cartOverlay.addEventListener('click', (e)=>{
      if(e.target.classList.contains("transparentBcg")){
        this.hideCart();
      }
    });
  }
  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0])
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }
  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }
}

// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  // setup app 
  ui.setupAPP();
  // get all products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
      //linking to the sorting function here, passing through the products and ui to link
      sortProductByType(ui,products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
//event delegation - adding the event listener on the entire section
function sortProductByType(ui, products) {
  let buttonList = document.getElementById('sort-section');
  buttonList.addEventListener('click', (e) => {
    //only listening for clicks on buttons in sort-section
    if (e.target.tagName === "BUTTON") {
      const sortType = e.target.innerText.toLowerCase();
      ui.filterItems(sortType,products)
    }
  });
}

//----------------accessibility mode code-------------------//
let toggle = document.getElementById("access-button");

toggle.addEventListener('click', ()=>{
  //elements to be toggled on applying the accessibility mode
  const navbar = document.getElementsByClassName('navbar');
  const bannerButton = document.getElementsByClassName('banner-btn');
  const sortSection = document.getElementById('sort-section');
  const footer = document.getElementsByTagName("FOOTER");
  const cartButton = document.getElementsByClassName("cart-footer");
  const cartItems = document.getElementsByClassName('cart-item');
  const bagButtons = document.getElementsByClassName('bag-btn');
  const upButton = document.getElementById('myBtn');
  const socialIcons = document.getElementsByClassName('social-icons')
    for(let i=0; i < cartItems.length; i++){
      cartItems[i].classList.toggle('access-mode')
    }
    for(let i=0; i < bagButtons.length; i++){
      bagButtons[i].classList.toggle('access-mode')
    }
  navbar[0].classList.toggle('access-mode');
  bannerButton[0].classList.toggle('access-mode');
  cartButton[0].classList.toggle('access-mode');
  sortSection.classList.toggle('access-mode');
  console.log(upButton)
  upButton.classList.toggle('access-mode');
  footer[0].classList.toggle('access-mode');
  socialIcons[0].classList.toggle('access-mode')
});

//----------------top button when scroll-------------------//
// get the button
let myButton = document.getElementById("myBtn");
// when the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20) {
        myButton.style.display = "block";
      } else {
        myButton.style.display = "none";
      }
}
//----------------end of top button when scroll-------------------//


