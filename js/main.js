document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.getElementById("mobileMenuButton");
  const sidebar = document.getElementById("docsSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const searchInput = document.getElementById("documentationSearch");
  const sidebarNavigation = document.querySelector(".sidebar-navigation");

  /* =====================================================
     PRESERVE SIDEBAR SCROLL POSITION
     Keep the left navigation at EXACTLY the same scroll
     position when opening another documentation page.

     Important: depending on the CSS, either .docs-sidebar
     or .sidebar-navigation can be the real scrolling element.
     Save and restore BOTH so the sidebar never jumps to top.
     ===================================================== */
  const sidebarScrollStorageKey = "onepixDocsSidebarScrollStateV2";

  function getSidebarScrollState() {
    return {
      sidebar: sidebar ? sidebar.scrollTop : 0,
      navigation: sidebarNavigation ? sidebarNavigation.scrollTop : 0
    };
  }

  function applySidebarScrollState(state) {
    if (!state) return;

    const sidebarTop = Number(state.sidebar);
    const navigationTop = Number(state.navigation);

    if (sidebar && Number.isFinite(sidebarTop)) {
      sidebar.scrollTop = sidebarTop;
    }

    if (sidebarNavigation && Number.isFinite(navigationTop)) {
      sidebarNavigation.scrollTop = navigationTop;
    }
  }

  function saveSidebarScrollPosition() {
    try {
      sessionStorage.setItem(
        sidebarScrollStorageKey,
        JSON.stringify(getSidebarScrollState())
      );
    } catch (error) {
      /* Keep navigation working even when storage is unavailable. */
    }
  }

  function readSavedSidebarScrollState() {
    try {
      const saved = sessionStorage.getItem(sidebarScrollStorageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return null;

      return {
        sidebar: Number(parsed.sidebar) || 0,
        navigation: Number(parsed.navigation) || 0
      };
    } catch (error) {
      return null;
    }
  }

  function restoreSidebarScrollPosition() {
    const savedState = readSavedSidebarScrollState();
    if (!savedState) return;

    /* Restore immediately. */
    applySidebarScrollState(savedState);

    /* Restore again after DOM/layout work so nothing can push it back to 0. */
    requestAnimationFrame(function () {
      applySidebarScrollState(savedState);

      requestAnimationFrame(function () {
        applySidebarScrollState(savedState);
      });
    });

    setTimeout(function () {
      applySidebarScrollState(savedState);
    }, 50);

    setTimeout(function () {
      applySidebarScrollState(savedState);
    }, 200);
  }

  /* =====================================================
     SIDEBAR STRUCTURE
     Merge the old ABOUT PAGE group into HOMEPAGE SECTIONS
     and rename the combined group to SECTIONS.
     ===================================================== */
  const dropdownsBeforeMerge = Array.from(
    document.querySelectorAll(".nav-dropdown")
  );

  const sectionsDropdown = dropdownsBeforeMerge.find(function (dropdown) {
    const label = dropdown.querySelector(".nav-dropdown-toggle span");
    return label && label.textContent.trim() === "HOMEPAGE SECTIONS";
  });

  const aboutDropdown = dropdownsBeforeMerge.find(function (dropdown) {
    const label = dropdown.querySelector(".nav-dropdown-toggle span");
    return label && label.textContent.trim() === "ABOUT PAGE";
  });

  if (sectionsDropdown) {
    const sectionsTitle = sectionsDropdown.querySelector(
      ".nav-dropdown-toggle span"
    );

    if (sectionsTitle) {
      sectionsTitle.textContent = "SECTIONS";
    }

    if (aboutDropdown) {
      const sectionsSubmenu = sectionsDropdown.querySelector(".nav-submenu");
      const aboutSubmenu = aboutDropdown.querySelector(".nav-submenu");

      if (sectionsSubmenu && aboutSubmenu) {
        Array.from(aboutSubmenu.querySelectorAll(".nav-sub-link")).forEach(
          function (link) {
            sectionsSubmenu.appendChild(link);
          }
        );
      }

      aboutDropdown.remove();
    }
  }

  /* =====================================================
     PRODUCT PAGES SIDEBAR ITEM
     Keep Blog Posts v0 available across all documentation pages,
     even on older HTML files that do not yet contain the link.
     ===================================================== */
  const productPagesDropdown = Array.from(
    document.querySelectorAll(".nav-dropdown")
  ).find(function (dropdown) {
    const label = dropdown.querySelector(".nav-dropdown-toggle span");
    return label && label.textContent.trim() === "PRODUCT PAGES";
  });

  if (productPagesDropdown) {
    const productPagesSubmenu = productPagesDropdown.querySelector(".nav-submenu");

    if (productPagesSubmenu) {
      const existingBlogPosts = Array.from(
        productPagesSubmenu.querySelectorAll(".nav-sub-link")
      ).find(function (link) {
        return link.textContent.trim() === "Blog Posts v0";
      });

      if (!existingBlogPosts) {
        const blogPostsLink = document.createElement("a");
        blogPostsLink.className = "nav-sub-link";
        blogPostsLink.href = "./blog-posts-v0.html";
        blogPostsLink.textContent = "Blog Posts v0";

        const relatedProductsLink = Array.from(
          productPagesSubmenu.querySelectorAll(".nav-sub-link")
        ).find(function (link) {
          return link.textContent.trim() === "Related Products";
        });

        if (relatedProductsLink) {
          relatedProductsLink.insertAdjacentElement("afterend", blogPostsLink);
        } else {
          productPagesSubmenu.appendChild(blogPostsLink);
        }
      }
    }
  }

  /* Remove unused items from the combined SECTIONS list and
     rename About Hero Banner to the reusable, general Banner label. */
  document.querySelectorAll(".nav-sub-link").forEach(function (link) {
    let label = link.textContent.trim();

    if (
      label === "App Blocks" ||
      label === "About Page" ||
      label === "Featured Blog"
    ) {
      link.remove();
      return;
    }

    if (label === "About Hero Banner") {
      link.textContent = "Banner";
      label = "Banner";
    }
  });

  /* Featured Blog is intentionally not part of the SECTIONS sidebar. */
  if (sectionsDropdown) {
    sectionsDropdown.querySelectorAll(".nav-sub-link").forEach(function (link) {
      if (link.textContent.trim() === "Featured Blog") {
        link.remove();
      }
    });
  }

  /* Keep previous/next navigation wording consistent with the sidebar. */
  document.querySelectorAll(".page-navigation-title").forEach(function (title) {
    if (title.textContent.includes("About Hero Banner")) {
      title.textContent = title.textContent.replace("About Hero Banner", "Banner");
    }
  });

  /* Keep Featured Product available under SECTIONS on every documentation page. */
  (function enableSectionsFeaturedProduct() {
    if (!sectionsDropdown) return;

    const sectionsMenu = sectionsDropdown.querySelector(".nav-submenu");
    if (!sectionsMenu) return;

    let featuredProductLink = Array.from(sectionsMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Featured Product";
    });

    const collectionShowcaseLink = Array.from(sectionsMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Collection Showcase";
    });

    if (!featuredProductLink) {
      featuredProductLink = document.createElement("a");
      featuredProductLink.className = "nav-sub-link";
      featuredProductLink.textContent = "Featured Product";

      if (collectionShowcaseLink) {
        collectionShowcaseLink.insertAdjacentElement("afterend", featuredProductLink);
      } else {
        sectionsMenu.insertBefore(featuredProductLink, sectionsMenu.firstChild);
      }
    }

    featuredProductLink.textContent = "Featured Product";
    featuredProductLink.setAttribute("href", "./featured-product.html");
    featuredProductLink.classList.remove("disabled-link");
  })();

  /* =====================================================
     CUSTOMER PAGES
     This documentation group is not used. Remove the
     entire CUSTOMER PAGES section from the sidebar on
     every documentation page.
     ===================================================== */
  (function removeCustomerPagesSection() {
    Array.from(document.querySelectorAll(".nav-dropdown")).forEach(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");

      if (label && label.textContent.trim().toUpperCase() === "CUSTOMER PAGES") {
        dropdown.remove();
      }
    });
  })();

  restoreSidebarScrollPosition();

  const dropdowns = document.querySelectorAll(".nav-dropdown");
  const dropdownButtons = document.querySelectorAll(".nav-dropdown-toggle");

  /* =====================================================
     THEME SETTINGS SIDEBAR
     Currency Format and Search are not used in this
     documentation. Remove only those two items from the
     THEME SETTINGS group on every documentation page.
     ===================================================== */
  const themeSettingsDropdown = Array.from(
    document.querySelectorAll(".nav-dropdown")
  ).find(function (dropdown) {
    const label = dropdown.querySelector(".nav-dropdown-toggle span");
    return label && label.textContent.trim() === "THEME SETTINGS";
  });

  if (themeSettingsDropdown) {
    themeSettingsDropdown.querySelectorAll(".nav-sub-link").forEach(function (link) {
      const label = link.textContent.trim();

      if (label === "Currency Format" || label === "Search") {
        link.remove();
      }
    });
  }

  /* =====================================================
     REAL DOCUMENTATION PAGES
     Existing placeholders become working links here.
     ===================================================== */
  const pageRoutes = {
    "Introduction": "./index.html",
    "Favicon": "./favicon.html",
    "Logo": "./logo.html",
    "Site Title": "./site-title.html",
    "Global": "./global.html",
    "Typography": "./typography.html",
    "Colors": "./colors.html",
    "Buttons": "./buttons.html",
    "Product Cards": "./product-cards.html",
    "Features": "./features.html",
    "Cart": "./cart.html",
    "Social Media": "./social-media.html",
    "Announcement Bar": "./announcement-bar.html",
    "Header": "./header.html",
    "How to Add Navigation Menu": "./navigation-menu.html",
    "Mega Menu - Text": "./mega-menu-text.html",
    "Mega Menu - Products": "./mega-menu-products.html",
    "Slideshow V3": "./slideshow-v3.html",
    "Featured Collection V3": "./featured-collection-v3.html",
    "Collection Showcase": "./collection-showcase.html",
    "Featured Product": "./featured-product.html",
    "Hotspot Bundle": "./hotspot-bundle.html",
    "Icon With Text": "./icon-with-text.html",
    "Icon with text": "./icon-with-text.html",
    "Partner Logos": "./partner-logos.html",
    "Marquee": "./marquee.html",
    "Multicolumn": "./multicolumn.html",
    "Before After Skin": "./before-after-skin.html",
    "Content Block 1": "./content-block1.html",
    "Content Block 2": "./content-block2.html",
    "Content Block 3": "./content-block3.html",
    "Content Block 4": "./content-block4.html",
    "Testimonials": "./testimonials-v1.html",
    "Testimonials v1": "./testimonials-v1.html",
    "Instagram Slider": "./instagram-slider.html",
    "Collapsible Content": "./collapsible-content.html",
    "Newsletter": "./newsletter.html",
    "Rich Text": "./rich-text.html",
    "About Content 1": "./about-content1.html",
    "About Content 2": "./about-content2.html",
    "Banner": "./about-hero-banner.html",
    "About Hero Banner": "./about-hero-banner.html",
    "About Team": "./about-team.html",
    "About Content 3": "./about-content3.html",
    "Default Product": "./default-product.html",
    "Product Sticky Cart": "./product-sticky-cart.html",
    "Product Large Media": "./product-large-media.html",
    "Product Stacked": "./product-stacked.html",
    "Product Thumbnails": "./product-thumbnails.html",
    "Thumbnails 2 Columns": "./thumbnails-2-columns.html",
    "Product FAQ - Metafields": "./product-faq-metafields.html",
    "Related Products": "./related-products.html",
    "Blog Posts v0": "./blog-posts-v0.html",
    "Default Collection": "./default-collection.html",
    "Filter Drawer": "./filter-drawer.html",
    "Horizontal Filter": "./horizontal-filter.html",
    "Sidebar Filter": "./filter-sidebar.html",
    "Filter Sidebar": "./filter-sidebar.html",
    "Full Width": "./full-width.html",
    "Price Filter Input": "./price-filter-input.html",
    "Product 4 Columns": "./product-4-columns.html",
    "List Collections": "./collection-list.html",
    "Collection List Page": "./collection-list.html",
    "Collection List": "./collection-list.html",
    "Contact": "./contact.html",
    "FAQs": "./faqs.html",
    "Wishlist": "./wishlist.html",
    "Blog": "./blog.html",
    "Cart": "./cart.html",
    "Footer": "./footer.html",
    "Filters": "./filters.html",
    "Add Product": "./add-product.html",
    "Product Variants": "./product-variants.html",
    "Product Metafields": "./product-metafields.html",
    "Account Page": "./account-page.html",
    "Creating / Adding Product": "./add-product.html"
  };

  document.querySelectorAll(".nav-sub-link").forEach(function (link) {
    let label = link.textContent.trim();

    if (label === "Cart Page") {
      link.textContent = "Cart";
      label = "Cart";
    }

    if (label === "Navigation & Mega Menu") {
      link.textContent = "How to Add Navigation Menu";
      label = "How to Add Navigation Menu";
    }

    const route = pageRoutes[label];

    if (route) {
      link.setAttribute("href", route);
      link.classList.remove("disabled-link");
    }
  });

  /* Keep Mega Menu documentation links available under HEADER & FOOTER on every documentation page. */
  (function enableHeaderFooterMegaMenuLinks() {
    const headerFooterDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "HEADER & FOOTER";
    });

    if (!headerFooterDropdown) return;

    const headerFooterMenu = headerFooterDropdown.querySelector(".nav-submenu");
    if (!headerFooterMenu) return;

    function ensureLink(text, href, insertAfterText) {
      let link = Array.from(headerFooterMenu.querySelectorAll(".nav-sub-link")).find(function (item) {
        return item.textContent.trim() === text;
      });

      if (!link) {
        link = document.createElement("a");
        link.className = "nav-sub-link";
        link.textContent = text;

        const insertAfter = Array.from(headerFooterMenu.querySelectorAll(".nav-sub-link")).find(function (item) {
          return item.textContent.trim() === insertAfterText;
        });

        if (insertAfter) {
          insertAfter.insertAdjacentElement("afterend", link);
        } else {
          const footerLink = Array.from(headerFooterMenu.querySelectorAll(".nav-sub-link")).find(function (item) {
            return item.textContent.trim() === "Footer";
          });

          if (footerLink) {
            headerFooterMenu.insertBefore(link, footerLink);
          } else {
            headerFooterMenu.appendChild(link);
          }
        }
      }

      link.setAttribute("href", href);
      link.classList.remove("disabled-link");
      return link;
    }

    ensureLink("Mega Menu - Text", "./mega-menu-text.html", "How to Add Navigation Menu");
    ensureLink("Mega Menu - Products", "./mega-menu-products.html", "Mega Menu - Text");
  })();

  /* Keep Collection List under OTHER PAGES on every documentation page. */
  (function moveCollectionListToOtherPages() {
    const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));

    const otherPagesDropdown = dropdowns.find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "OTHER PAGES";
    });

    if (!otherPagesDropdown) return;

    const otherPagesMenu = otherPagesDropdown.querySelector(".nav-submenu");
    if (!otherPagesMenu) return;

    const collectionListLinks = Array.from(document.querySelectorAll(".nav-sub-link")).filter(function (link) {
      const label = link.textContent.trim();
      return label === "Collection List Page" || label === "Collection List" || label === "List Collections";
    });

    let collectionListLink = collectionListLinks.shift();

    if (!collectionListLink) {
      collectionListLink = document.createElement("a");
      collectionListLink.className = "nav-sub-link";
      collectionListLink.textContent = "Collection List";
    }

    collectionListLink.textContent = "Collection List";
    collectionListLink.setAttribute("href", "./collection-list.html");
    collectionListLink.classList.remove("disabled-link");

    collectionListLinks.forEach(function (duplicate) {
      duplicate.remove();
    });

    otherPagesMenu.insertBefore(collectionListLink, otherPagesMenu.firstChild);
  })();


  /* Keep Wishlist available under OTHER PAGES on every documentation page. */
  (function enableOtherPagesWishlist() {
    const otherPagesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "OTHER PAGES";
    });

    if (!otherPagesDropdown) return;

    const otherPagesMenu = otherPagesDropdown.querySelector(".nav-submenu");
    if (!otherPagesMenu) return;

    const wishlistLink = Array.from(otherPagesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Wishlist";
    });

    if (!wishlistLink) return;

    wishlistLink.setAttribute("href", "./wishlist.html");
    wishlistLink.classList.remove("disabled-link");
  })();



  /* Keep Blog available under OTHER PAGES on every documentation page. */
  (function enableOtherPagesBlog() {
    const otherPagesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "OTHER PAGES";
    });

    if (!otherPagesDropdown) return;

    const otherPagesMenu = otherPagesDropdown.querySelector(".nav-submenu");
    if (!otherPagesMenu) return;

    let blogLink = Array.from(otherPagesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Blog";
    });

    if (!blogLink) {
      blogLink = document.createElement("a");
      blogLink.className = "nav-sub-link";
      blogLink.textContent = "Blog";

      const wishlistLink = Array.from(otherPagesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Wishlist";
      });

      if (wishlistLink) {
        wishlistLink.insertAdjacentElement("afterend", blogLink);
      } else {
        otherPagesMenu.appendChild(blogLink);
      }
    }

    blogLink.setAttribute("href", "./blog.html");
    blogLink.classList.remove("disabled-link");
  })();

  /* Remove unused entries from OTHER PAGES on every documentation page. */
  (function removeUnusedOtherPagesLinks() {
    const otherPagesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "OTHER PAGES";
    });

    if (!otherPagesDropdown) return;

    const labelsToRemove = new Set([
      "Article",
      "Search Page",
      "404 Page",
      "Password Page"
    ]);

    otherPagesDropdown.querySelectorAll(".nav-sub-link").forEach(function (link) {
      if (labelsToRemove.has(link.textContent.trim())) {
        link.remove();
      }
    });
  })();


  /* Remove unused entries from STORE FEATURES on every documentation page. */
  (function removeUnusedStoreFeaturesLinks() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const labelsToRemove = new Set([
      "Cart Drawer",
      "Quick Add",
      "Predictive Search",
      "Product Swatches",
      "Pickup Availability",
      "Country & Language",
      "Country & Languages",
      "Breadcrumb",
      "Breadcrumbs"
    ]);

    storeFeaturesDropdown.querySelectorAll(".nav-sub-link").forEach(function (link) {
      if (labelsToRemove.has(link.textContent.trim())) {
        link.remove();
      }
    });
  })();

  /* Keep Add Product available under STORE FEATURES on every documentation page. */
  (function enableStoreFeaturesAddProduct() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const storeFeaturesMenu = storeFeaturesDropdown.querySelector(".nav-submenu");
    if (!storeFeaturesMenu) return;

    let addProductLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      const label = link.textContent.trim();
      return label === "Add Product" || label === "Creating / Adding Product";
    });

    if (!addProductLink) {
      addProductLink = document.createElement("a");
      addProductLink.className = "nav-sub-link";
      addProductLink.textContent = "Add Product";
      storeFeaturesMenu.insertBefore(addProductLink, storeFeaturesMenu.firstChild);
    }

    addProductLink.textContent = "Add Product";
    addProductLink.setAttribute("href", "./add-product.html");
    addProductLink.classList.remove("disabled-link");
  })();

  /* Keep Product Variants available under STORE FEATURES on every documentation page. */
  (function enableStoreFeaturesProductVariants() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const storeFeaturesMenu = storeFeaturesDropdown.querySelector(".nav-submenu");
    if (!storeFeaturesMenu) return;

    let variantsLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      const label = link.textContent.trim();
      return label === "Product Variants" || label === "Variants";
    });

    const addProductLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Add Product";
    });

    if (!variantsLink) {
      variantsLink = document.createElement("a");
      variantsLink.className = "nav-sub-link";
      variantsLink.textContent = "Product Variants";

      if (addProductLink && addProductLink.nextSibling) {
        addProductLink.insertAdjacentElement("afterend", variantsLink);
      } else if (addProductLink) {
        addProductLink.insertAdjacentElement("afterend", variantsLink);
      } else {
        storeFeaturesMenu.insertBefore(variantsLink, storeFeaturesMenu.firstChild);
      }
    }

    variantsLink.textContent = "Product Variants";
    variantsLink.setAttribute("href", "./product-variants.html");
    variantsLink.classList.remove("disabled-link");
  })();

  /* Keep Product Metafields available under STORE FEATURES on every documentation page. */
  (function enableStoreFeaturesProductMetafields() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const storeFeaturesMenu = storeFeaturesDropdown.querySelector(".nav-submenu");
    if (!storeFeaturesMenu) return;

    let metafieldsLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      const label = link.textContent.trim();
      return label === "Product Metafields" || label === "Metafields";
    });

    const variantsLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Product Variants";
    });

    if (!metafieldsLink) {
      metafieldsLink = document.createElement("a");
      metafieldsLink.className = "nav-sub-link";
      metafieldsLink.textContent = "Product Metafields";

      if (variantsLink) {
        variantsLink.insertAdjacentElement("afterend", metafieldsLink);
      } else {
        storeFeaturesMenu.insertBefore(metafieldsLink, storeFeaturesMenu.firstChild);
      }
    }

    metafieldsLink.textContent = "Product Metafields";
    metafieldsLink.setAttribute("href", "./product-metafields.html");
    metafieldsLink.classList.remove("disabled-link");
  })();

  /* Keep Filters available under STORE FEATURES on every documentation page. */
  (function enableStoreFeaturesFilters() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const storeFeaturesMenu = storeFeaturesDropdown.querySelector(".nav-submenu");
    if (!storeFeaturesMenu) return;

    let filtersLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Filters";
    });

    if (!filtersLink) {
      filtersLink = document.createElement("a");
      filtersLink.className = "nav-sub-link";
      filtersLink.textContent = "Filters";

      const metafieldsLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Product Metafields";
      });

      const variantsLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Product Variants";
      });

      const addProductLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Add Product";
      });

      if (metafieldsLink) {
        metafieldsLink.insertAdjacentElement("afterend", filtersLink);
      } else if (variantsLink) {
        variantsLink.insertAdjacentElement("afterend", filtersLink);
      } else if (addProductLink) {
        addProductLink.insertAdjacentElement("afterend", filtersLink);
      } else {
        storeFeaturesMenu.insertBefore(filtersLink, storeFeaturesMenu.firstChild);
      }
    }

    filtersLink.setAttribute("href", "./filters.html");
    filtersLink.classList.remove("disabled-link");
  })();


  /* Keep Account Page available under STORE FEATURES on every documentation page. */
  (function enableStoreFeaturesAccountPage() {
    const storeFeaturesDropdown = Array.from(document.querySelectorAll(".nav-dropdown")).find(function (dropdown) {
      const label = dropdown.querySelector(".nav-dropdown-toggle span");
      return label && label.textContent.trim().toUpperCase() === "STORE FEATURES";
    });

    if (!storeFeaturesDropdown) return;

    const storeFeaturesMenu = storeFeaturesDropdown.querySelector(".nav-submenu");
    if (!storeFeaturesMenu) return;

    let accountPageLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
      return link.textContent.trim() === "Account Page";
    });

    if (!accountPageLink) {
      accountPageLink = document.createElement("a");
      accountPageLink.className = "nav-sub-link";
      accountPageLink.textContent = "Account Page";

      const wishlistLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Wishlist";
      });

      const filtersLink = Array.from(storeFeaturesMenu.querySelectorAll(".nav-sub-link")).find(function (link) {
        return link.textContent.trim() === "Filters";
      });

      if (wishlistLink) {
        wishlistLink.insertAdjacentElement("afterend", accountPageLink);
      } else if (filtersLink) {
        filtersLink.insertAdjacentElement("afterend", accountPageLink);
      } else {
        storeFeaturesMenu.appendChild(accountPageLink);
      }
    }

    accountPageLink.setAttribute("href", "./account-page.html");
    accountPageLink.classList.remove("disabled-link");
  })();

  const documentationLinks = document.querySelectorAll(".nav-sub-link");

  [sidebar, sidebarNavigation].forEach(function (scrollElement) {
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", saveSidebarScrollPosition, {
      passive: true
    });
  });

  /* Save before the browser leaves this page as an extra safeguard. */
  window.addEventListener("pagehide", saveSidebarScrollPosition);
  window.addEventListener("beforeunload", saveSidebarScrollPosition);

  /* Automatically mark the current sidebar page active. */
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  documentationLinks.forEach(function (link) {
    const href = link.getAttribute("href");

    if (!href || href === "#") return;

    const linkFile = href.split("/").pop();
    link.classList.toggle("active", linkFile === currentFile);
  });

  /* =====================================================
     PREVIOUS / NEXT DOCUMENTATION NAVIGATION
     Build navigation from the FINAL visible sidebar order
     instead of relying on stale hard-coded links in each
     HTML page.

     This keeps Previous / Next correct after sidebar items
     are renamed, moved, inserted, removed, or enabled.
     Duplicate routes (for example Cart/Wishlist appearing
     in more than one group) are included only once.
     ===================================================== */
  (function syncArticlePreviousNextNavigation() {
    const articleNavigation = document.querySelector(".article-navigation");
    if (!articleNavigation) return;

    const pages = [];
    const seenFiles = new Set();

    document
      .querySelectorAll(".sidebar-navigation .nav-sub-link")
      .forEach(function (link) {
        if (link.classList.contains("disabled-link")) return;

        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        let linkUrl;

        try {
          linkUrl = new URL(href, window.location.href);
        } catch (error) {
          return;
        }

        const file = linkUrl.pathname.split("/").pop() || "index.html";

        if (!file.endsWith(".html") || seenFiles.has(file)) return;

        seenFiles.add(file);

        pages.push({
          file: file,
          href: "./" + file,
          title: link.textContent.trim()
        });
      });

    const currentIndex = pages.findIndex(function (page) {
      return page.file === currentFile;
    });

    if (currentIndex === -1) return;

    const previousPage =
      currentIndex > 0 ? pages[currentIndex - 1] : null;

    const nextPage =
      currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

    articleNavigation.innerHTML = "";

    if (previousPage) {
      const previousLink = document.createElement("a");
      previousLink.className = "previous-page";
      previousLink.href = previousPage.href;

      const previousLabel = document.createElement("span");
      previousLabel.className = "page-navigation-label";
      previousLabel.textContent = "PREVIOUS";

      const previousTitle = document.createElement("span");
      previousTitle.className = "page-navigation-title";
      previousTitle.textContent = "← " + previousPage.title;

      previousLink.appendChild(previousLabel);
      previousLink.appendChild(previousTitle);
      articleNavigation.appendChild(previousLink);
    }

    if (nextPage) {
      const nextLink = document.createElement("a");
      nextLink.className = "next-page";
      nextLink.href = nextPage.href;

      /* When there is no Previous link, keep Next in the
         right-hand navigation column. */
      if (!previousPage) {
        nextLink.style.gridColumn = "2";
      }

      const nextLabel = document.createElement("span");
      nextLabel.className = "page-navigation-label";
      nextLabel.textContent = "NEXT";

      const nextTitle = document.createElement("span");
      nextTitle.className = "page-navigation-title";
      nextTitle.textContent = nextPage.title + " →";

      nextLink.appendChild(nextLabel);
      nextLink.appendChild(nextTitle);
      articleNavigation.appendChild(nextLink);
    }
  })();

  function openSidebar() {
    if (!sidebar) return;

    sidebar.classList.add("is-open");

    if (overlay) {
      overlay.classList.add("is-visible");
    }

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "true");
    }

    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (!sidebar) return;

    sidebar.classList.remove("is-open");

    if (overlay) {
      overlay.classList.remove("is-visible");
    }

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }

    document.body.style.overflow = "";
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      if (sidebar && sidebar.classList.contains("is-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 767) {
      closeSidebar();
    }
  });

  /* All dropdowns stay open by default and toggle independently. */
  dropdownButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const currentDropdown = button.closest(".nav-dropdown");

      if (!currentDropdown) return;

      const currentlyOpen = currentDropdown.classList.contains("is-open");

      currentDropdown.classList.toggle("is-open", !currentlyOpen);
      button.setAttribute(
        "aria-expanded",
        currentlyOpen ? "false" : "true"
      );
    });
  });

  /* Only pages that have not been created yet remain inactive. */
  document.querySelectorAll(".disabled-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  documentationLinks.forEach(function (link) {
    link.addEventListener("pointerdown", function () {
      if (!link.classList.contains("disabled-link")) {
        saveSidebarScrollPosition();
      }
    });
  });

  documentationLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (!link.classList.contains("disabled-link")) {
        saveSidebarScrollPosition();
      }

      if (
        window.innerWidth <= 767 &&
        !link.classList.contains("disabled-link")
      ) {
        closeSidebar();
      }
    });
  });

  /* Final restore after all sidebar links and active states are ready. */
  restoreSidebarScrollPosition();

  window.addEventListener("pageshow", function () {
    restoreSidebarScrollPosition();
  });

  window.addEventListener("load", function () {
    restoreSidebarScrollPosition();
  });

  /* Sidebar search. */
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = searchInput.value.trim().toLowerCase();

      if (query === "") {
        dropdowns.forEach(function (dropdown) {
          dropdown.classList.remove("search-hidden");

          const links = dropdown.querySelectorAll(".nav-sub-link");
          links.forEach(function (link) {
            link.style.display = "flex";
          });

          dropdown.classList.add("is-open");

          const toggle = dropdown.querySelector(".nav-dropdown-toggle");
          if (toggle) {
            toggle.setAttribute("aria-expanded", "true");
          }
        });

        return;
      }

      dropdowns.forEach(function (dropdown) {
        const button = dropdown.querySelector(".nav-dropdown-toggle");
        const links = dropdown.querySelectorAll(".nav-sub-link");
        const groupText = button
          ? button.textContent.trim().toLowerCase()
          : "";
        const groupMatches = groupText.includes(query);
        let hasResult = groupMatches;

        links.forEach(function (link) {
          const linkText = link.textContent.trim().toLowerCase();
          const matches = groupMatches || linkText.includes(query);

          link.style.display = matches ? "flex" : "none";

          if (matches) {
            hasResult = true;
          }
        });

        if (hasResult) {
          dropdown.classList.remove("search-hidden");
          dropdown.classList.add("is-open");

          if (button) {
            button.setAttribute("aria-expanded", "true");
          }
        } else {
          dropdown.classList.add("search-hidden");
        }
      });
    });
  }
});