/**
 * Bintang menus, transcribed from the printed À la carte and Brunch cards
 * (Nov 2026). Prices are in pounds; the page shows bare numbers like the cards.
 * Dietary marks live in the dish name: V vegetarian, VE vegan, PN peanuts, GF gluten free.
 */

export type MenuItem = {
  name: string;
  /** Bare number(s), e.g. "17.5" or "32 / 8" (bottle / glass). Omitted when the note carries the price. */
  price?: string;
  desc?: string;
  /** Bold line under the description: portion options, "Suitable for 2", etc. */
  note?: string;
};

export type MenuSection = {
  title: string;
  /** Second heading line, e.g. "Curries & stews" under "Ulam". */
  sub?: string;
  /** Italic line under the heading. */
  intro?: string;
  /** Right-aligned column label above prices, e.g. "BOTTLE / GLASS". */
  colHead?: string;
  /** Italic line after the list. */
  foot?: string;
  /** Drawn inside a hairline box, like Silogs on the printed card. */
  boxed?: boolean;
  items: MenuItem[];
};

/** Full-width block after the columns (e.g. Bottomless drinks). */
export type MenuFeature = {
  title: string;
  lead?: string;
  foot?: string;
  items: MenuItem[];
};

export type MenuSheet = {
  /** Band heading, e.g. "À la carte · Food". */
  label: string;
  sections: MenuSection[];
  wide?: MenuFeature[];
  /** Line under the "Karaoke at Bintang" banner; no banner when omitted. */
  karaoke?: string;
  /** Show the halal / allergen / service-charge notes. */
  legal?: boolean;
  /** Show the karaoke video above the sections. */
  video?: boolean;
};

export type MenuId = "carte" | "brunch" | "desserts" | "karaoke";

export type Menu = {
  id: MenuId;
  label: string;
  /** Text colour for the whole page while this menu is open (headings, MENU title, body, rules). */
  accent: string;
  /** Page background while this menu is open. The page fades between menus, like Mala Project. */
  background: string;
  sheets: MenuSheet[];
};

export const menus: Menu[] = [
  {
    "id": "carte",
    "label": "À la carte",
    "accent": "#2D2D2D",
    "background": "#EDE9E9",
    "sheets": [
      {
        "label": "À la carte · Food",
        "sections": [
          {
            "title": "Small plates",
            "items": [
              {
                "name": "Pandesal",
                "price": "6",
                "desc": "Two toasted pandesal served with truffle butter"
              },
              {
                "name": "Okoy Fritters (GF) (VE)",
                "price": "7",
                "desc": "Shredded root vegetables, spiced vinegar"
              },
              {
                "name": "Lumpiang Cigarillos",
                "desc": "Beef mince and water chestnut spring rolls, sweet chilli sauce and spiced vinegar",
                "note": "3pc £6 or 6pc £10"
              },
              {
                "name": "Calamansi Hot Honey Wings",
                "price": "8",
                "desc": "Crispy fried chicken wings tossed in calamansi hot honey"
              },
              {
                "name": "Calamansi Hot Honey King Prawns (GF)",
                "price": "14",
                "desc": "Prawn tempura, garlic, hot honey calamansi sauce"
              },
              {
                "name": "Pandesal Slider",
                "price": "10",
                "desc": "Beef patty in a pandesal bun, with American cheese, toyomansi onions and bagoong aioli"
              }
            ]
          },
          {
            "title": "Grill & skillet",
            "items": [
              {
                "name": "Oak Smoked Chicken Inasal",
                "price": "16",
                "desc": "Oak smoked and grilled thigh marinated in classic Filipino aromatics"
              },
              {
                "name": "Spicy Beef Sisig",
                "price": "17.5",
                "desc": "Sizzling beef brisket, chilli, soy, calamansi, coconut vinegar, chicharon"
              },
              {
                "name": "Inasal Platter",
                "price": "32",
                "desc": "Oak smoked whole grilled chicken on the bone marinated in classic Filipino aromatics, served with toyomansi",
                "note": "Suitable for 2–3 guests"
              }
            ]
          },
          {
            "title": "Noodles",
            "items": [
              {
                "name": "Bintang Noodles (V opt)",
                "price": "17",
                "desc": "Egg noodles stir fried in Bintang sauce. Choice between chicken (+£1) or tofu & aubergine"
              },
              {
                "name": "Seafood Palabok",
                "price": "17",
                "desc": "Filipino noodle dish, shrimp sauce, topped with shrimp, squid, crab meat and smoked mackerel"
              }
            ]
          },
          {
            "title": "Ulam",
            "sub": "Curries & stews",
            "items": [
              {
                "name": "Filipino Lamb Curry (GF)",
                "price": "18",
                "desc": "Slow cooked lamb, coconut lemongrass curry"
              },
              {
                "name": "Oxtail Kare Kare (PN)",
                "price": "19",
                "desc": "Oxtail peanut stew served with sautéed shrimp paste"
              },
              {
                "name": "Ulek Curry (VE opt)",
                "desc": "Mangosteen & Naga chilli-based curry with choice of chicken (£17), tofu + aubergine (£16) or prawns (£18)"
              },
              {
                "name": "Bintang Curry (VE opt)",
                "desc": "Creamy coconut & our signature blend of herbs & spices, with a choice of chicken (£17), tofu + aubergine (£16) or prawns (£18)"
              },
              {
                "name": "Chicken Adobo",
                "price": "16.5",
                "desc": "Boneless leg, marinated in soy, vinegar, bay leaf, black pepper, served with soft boiled egg"
              }
            ]
          },
          {
            "title": "Greens & salads",
            "items": [
              {
                "name": "Garlic Fried Green Beans",
                "price": "5.5"
              },
              {
                "name": "Laing",
                "price": "7",
                "desc": "Taro leaves cooked in coconut milk, chilli, fish sauce"
              },
              {
                "name": "Talong and Mango Ensalada",
                "price": "7.5",
                "desc": "Smoked aubergine, bagoong, mango, onion, coriander"
              },
              {
                "name": "Papaya Salad (PN)",
                "price": "10",
                "desc": "Papaya, calamansi, Asian herbs, dried shrimp & fish sauce"
              }
            ]
          },
          {
            "title": "Sides",
            "items": [
              {
                "name": "Jasmine Rice (GF) (VE)",
                "price": "4"
              },
              {
                "name": "Garlic Fried Rice (VE)",
                "price": "5"
              },
              {
                "name": "Fried Potato Salad",
                "price": "6",
                "desc": "Fried potatoes, feta cheese, bagoong aioli"
              },
              {
                "name": "Bagoong Fried Rice",
                "price": "8.5",
                "desc": "Fermented shrimp paste, egg, mango, tomato, onion, coriander"
              },
              {
                "name": "Plain Roti (VE)",
                "price": "3"
              }
            ]
          }
        ]
      },
      {
        "label": "À la carte · Drinks",
        "sections": [
          {
            "title": "Cocktails",
            "items": [
              {
                "name": "Ube Colada",
                "price": "12.5",
                "desc": "House clarified ube rum, coconut water, pineapple"
              },
              {
                "name": "Picante",
                "price": "12",
                "desc": "Tequila, lime, agave, chilli"
              },
              {
                "name": "Kuya Tommy",
                "price": "12",
                "desc": "Tarsier Taipei Old Tom gin, calamansi, tonic"
              },
              {
                "name": "Pandan Old Fashioned",
                "price": "12",
                "desc": "Whiskey, pandan, Angostura, orange essence"
              },
              {
                "name": "Margarita",
                "price": "11",
                "desc": "Tequila, triple sec, lime"
              },
              {
                "name": "Negroni",
                "price": "11",
                "desc": "Gin, Campari, sweet vermouth"
              },
              {
                "name": "Lychee Coconut Daiquiri",
                "price": "12",
                "desc": "Rum, coconut, lychee, lime, sugar"
              }
            ]
          },
          {
            "title": "0% Alcohol",
            "items": [
              {
                "name": "Calamansi-ade",
                "price": "8",
                "desc": "Calamansi, lemon, soda, sugar"
              },
              {
                "name": "Passion Fruit Fizz",
                "price": "12",
                "desc": "Passion fruit, lime, vanilla, soda"
              },
              {
                "name": "Lychee Moquiri",
                "price": "9",
                "desc": "Lychee, lime, sugar, mint"
              }
            ]
          },
          {
            "title": "Soft drinks",
            "items": [
              {
                "name": "Coke",
                "price": "4"
              },
              {
                "name": "Diet Coke",
                "price": "4"
              },
              {
                "name": "Sprite",
                "price": "4"
              },
              {
                "name": "Ting",
                "price": "4"
              },
              {
                "name": "Ginger Beer",
                "price": "4"
              }
            ]
          },
          {
            "title": "Beers",
            "items": [
              {
                "name": "Tiger Beer · 4.8% ABV",
                "price": "6"
              },
              {
                "name": "San Miguel · 5% ABV",
                "price": "5.5"
              },
              {
                "name": "Lucky Saint · 0.05% ABV",
                "price": "6.5"
              }
            ]
          },
          {
            "title": "Red wine",
            "colHead": "BOTTLE / GLASS",
            "items": [
              {
                "name": "Côtes du Rhône",
                "price": "40 / 10",
                "desc": "Soft and fruity French red wine"
              },
              {
                "name": "Merlo Basco",
                "price": "32 / 8",
                "desc": "Full-bodied, dark berry, sweet spice and noble tannins"
              }
            ]
          },
          {
            "title": "White wine",
            "colHead": "BOTTLE / GLASS",
            "items": [
              {
                "name": "Barbera d’Alba",
                "price": "32 / 8",
                "desc": "Bright acidity, luscious dark cherry and plum fruit flavours, and soft tannins"
              },
              {
                "name": "Sauvignon Blanc",
                "price": "35 / 9",
                "desc": "Fresh, dry and crisp Spanish wine, aromas of apple, pear and citrus"
              }
            ]
          },
          {
            "title": "Sparkling / rosé",
            "colHead": "BOTTLE / GLASS",
            "items": [
              {
                "name": "Prosecco Superiore",
                "price": "32 / 8",
                "desc": "Refined, complex aromas of apple, pear and white flowers, and a crisp finish"
              },
              {
                "name": "Marcel Hubert Rosé",
                "price": "30 / 8",
                "desc": "A delicate rosé combining summer berry aromas and a sweet tangy flavour of strawberries and raspberries"
              }
            ]
          }
        ],
        "karaoke": "Large space available for booking",
        "legal": true
      }
    ]
  },
  {
    "id": "brunch",
    "label": "Brunch",
    "accent": "#2D2D2D",
    "background": "#F6DE43",
    "sheets": [
      {
        "label": "Brunch · Food",
        "sections": [
          {
            "title": "Starters",
            "foot": "See the specials board for more",
            "items": [
              {
                "name": "Okoy Fritters (GF) (VE)",
                "price": "7",
                "desc": "Shredded root vegetables, spiced vinegar"
              },
              {
                "name": "Calamansi Hot Honey Wings",
                "price": "7",
                "desc": "Garlic, calamansi, chillies, fish sauce honey"
              },
              {
                "name": "Lumpiang Cigarillos",
                "desc": "Beef mince and water chestnut spring rolls, sweet chilli sauce and spiced vinegar",
                "note": "3pc £6 or 6pc £10"
              },
              {
                "name": "Calamansi Hot Honey King Prawns (GF)",
                "price": "13.5",
                "desc": "Prawn tempura, garlic, hot honey calamansi sauce"
              }
            ]
          },
          {
            "title": "Brunch plates",
            "items": [
              {
                "name": "Tapa Steak, Eggs n’ Tats",
                "price": "18",
                "desc": "Sweet cured picanha, fried eggs, smashed tats"
              },
              {
                "name": "Longanisa Shakshuka Skillet",
                "price": "18",
                "desc": "Longanisa (lamb & beef mince) and eggs cooked in spiced tomato stew, served with pandesal"
              },
              {
                "name": "Inasal & Kanin Plate",
                "price": "29",
                "desc": "Whole chicken, jasmine rice, toyomansi",
                "note": "Suitable for 2"
              },
              {
                "name": "Seafood Palabok",
                "price": "17",
                "desc": "Filipino noodle dish, shrimp sauce, topped with shrimp, squid and smoked mackerel"
              },
              {
                "name": "Oxtail Kare Kare (PN)",
                "price": "19",
                "desc": "Oxtail peanut stew served with sautéed shrimp paste"
              },
              {
                "name": "Filipino Lamb Curry (GF)",
                "price": "18",
                "desc": "Slow cooked lamb, coconut lemongrass curry"
              }
            ]
          },
          {
            "title": "Silogs",
            "intro": "Silogs are classic Filipino breakfast meals made with garlic fried rice, served with a fried egg, cherry tomatoes, pickles and Bintang pinakurat",
            "boxed": true,
            "items": [
              {
                "name": "Laingsilog",
                "price": "15",
                "desc": "Taro leaves cooked in coconut milk, chilli, fish sauce"
              },
              {
                "name": "Bangsilog",
                "price": "16.5",
                "desc": "Shallow-fried, lightly battered milkfish (bangus)"
              },
              {
                "name": "Longsilog",
                "price": "16",
                "desc": "Longanisa: sweet, garlicky, lamb & beef sausages"
              },
              {
                "name": "Tocsilog",
                "price": "16.5",
                "desc": "Boneless chicken tocino: sweet and garlicky"
              }
            ]
          },
          {
            "title": "Sides",
            "items": [
              {
                "name": "Jasmine Rice (GF) (VE)",
                "price": "4"
              },
              {
                "name": "Garlic Rice",
                "price": "5"
              },
              {
                "name": "Smashed Tats",
                "price": "5",
                "desc": "Fried baby potatoes, fried onions, bagoong aioli, nori seaweed powder"
              }
            ]
          },
          {
            "title": "Greens & salad",
            "items": [
              {
                "name": "Atchara",
                "price": "4",
                "desc": "Pickled papaya, carrot, red onion, red pepper"
              },
              {
                "name": "Garlic Fried Green Beans",
                "price": "5.5"
              },
              {
                "name": "Laing",
                "price": "6.5",
                "desc": "Taro leaves cooked in coconut milk, chilli, fish sauce"
              },
              {
                "name": "Talong and Mango Ensalada",
                "price": "7.5",
                "desc": "Smoked aubergine, bagoong, mango, cucumber, red pepper, onion, coriander"
              }
            ]
          },
          {
            "title": "Extras",
            "items": [
              {
                "name": "Pandesal",
                "price": "1",
                "desc": "1pc fresh Filipino bread"
              },
              {
                "name": "Milk Fish (Bangus)",
                "price": "8.5",
                "desc": "Shallow fried, lightly battered"
              },
              {
                "name": "Chicken Tocino",
                "price": "7.5",
                "desc": "Sweet garlicky grilled chicken"
              },
              {
                "name": "Longanisa",
                "price": "7.5",
                "desc": "3pcs sweet Filipino sausage (lamb & beef mince)"
              },
              {
                "name": "Fried Egg",
                "price": "3"
              }
            ]
          }
        ]
      },
      {
        "label": "Brunch · Drinks",
        "sections": [
          {
            "title": "Cocktails",
            "items": [
              {
                "name": "Ube Colada",
                "price": "12.5",
                "desc": "House clarified ube rum, coconut water, pineapple"
              },
              {
                "name": "Mimosa",
                "price": "9",
                "desc": "Superiore prosecco, orange juice"
              },
              {
                "name": "Superiore Prosecco",
                "price": "8",
                "desc": "Or request a bottle (£32)"
              },
              {
                "name": "Lychee Daiquiri",
                "price": "11",
                "desc": "Rum, lychee, lime, sugar"
              },
              {
                "name": "Kuya Tommy",
                "price": "12",
                "desc": "Tarsier Taipei Old Tom gin, calamansi, tonic"
              },
              {
                "name": "Margarita",
                "price": "12",
                "desc": "Calamansi, tequila, triple sec, lime"
              }
            ]
          },
          {
            "title": "Milkshakes",
            "items": [
              {
                "name": "Mango Shake",
                "price": "8",
                "desc": "Mango sorbet, milk, whipped cream"
              },
              {
                "name": "Ube Shake",
                "price": "8",
                "desc": "Ube ice cream, milk, whipped cream"
              },
              {
                "name": "Milo Shake",
                "price": "8",
                "desc": "Milo ice cream, milk, whipped cream"
              }
            ]
          },
          {
            "title": "Hot drinks",
            "items": [
              {
                "name": "Green Tea",
                "price": "3"
              },
              {
                "name": "Breakfast / Earl Grey Tea",
                "price": "2.5"
              },
              {
                "name": "Filter Coffee",
                "price": "4.5",
                "desc": "Free refills"
              }
            ]
          },
          {
            "title": "Non-alcoholic",
            "items": [
              {
                "name": "Calamansi-ade",
                "price": "8",
                "desc": "Calamansi juice, soda, sugar"
              },
              {
                "name": "Passion Fruit Fizz",
                "price": "8",
                "desc": "Passion fruit, lime, vanilla, soda"
              },
              {
                "name": "Ting",
                "price": "3",
                "desc": "Sparkling grapefruit"
              },
              {
                "name": "Coke",
                "price": "4"
              },
              {
                "name": "Sprite",
                "price": "4"
              },
              {
                "name": "Diet Coke",
                "price": "4"
              },
              {
                "name": "Orange Juice",
                "price": "4"
              }
            ]
          }
        ],
        "wide": [
          {
            "title": "Bottomless drinks",
            "lead": "Choose from the unlimited cocktails or bubbles below for just £23 per person.",
            "foot": "Bottomless deal is not shareable and lasts a maximum of 1.5 hours. T&Cs apply.",
            "items": [
              {
                "name": "Lychee Daiquiri",
                "desc": "Rum, lychee, lime, sugar"
              },
              {
                "name": "Mimosa",
                "desc": "Superiore prosecco, orange juice"
              },
              {
                "name": "Calamansi Margarita",
                "desc": "Calamansi, tequila, triple sec, sugar"
              },
              {
                "name": "Superiore Prosecco"
              }
            ]
          }
        ],
        "karaoke": "Open mic: Saturday 5pm – 11pm",
        "legal": true
      }
    ]
  },
  {
    "id": "desserts",
    "label": "Desserts",
    "accent": "#2D2D2D",
    "background": "#E9C0D4",
    "sheets": [
      {
        "label": "Desserts · Panghimagas",
        "sections": [
          {
            "title": "Desserts",
            "items": [
              {
                "name": "Halo-Halo",
                "price": "10",
                "desc": "Shaved ice, ice-cream of choice & toppings"
              },
              {
                "name": "Ube Leche Flan Cake",
                "price": "8",
                "desc": "Ube chiffon layered with a caramel pudding & ube cream"
              },
              {
                "name": "Buko Pie",
                "price": "9",
                "desc": "Coconut filling in a buttery pie crust"
              },
              {
                "name": "Mango Float",
                "price": "8",
                "desc": "Mango, whipped cream & malted biscuits"
              },
              {
                "name": "Ube Bilog",
                "price": "9.5",
                "desc": "Toasted pandesal ice-cream sandwich"
              },
              {
                "name": "Ube Brownie",
                "price": "7"
              }
            ]
          },
          {
            "title": "Ice cream",
            "intro": "Ube, pandan, queso, Milo, lychee, mango, calamansi",
            "items": [
              {
                "name": "One scoop",
                "price": "5.5"
              },
              {
                "name": "Two scoops",
                "price": "6.7"
              }
            ]
          },
          {
            "title": "Weekend brunch",
            "intro": "Sat & Sun brunch only. Our pandesal French toast is made fresh by our sister brand Cafe Mama & Sons",
            "boxed": true,
            "items": [
              {
                "name": "Ube French Toast",
                "price": "14",
                "desc": "Pandesal toast, homemade ube halaya, ube ice cream, coconut shavings, ube cream and nata de coco"
              },
              {
                "name": "Halo-Halo for 2",
                "price": "12",
                "desc": "Classic Filipino shaved ice dessert with sweet mix-ins"
              }
            ]
          }
        ],
        "legal": true
      }
    ]
  },
  {
    "id": "karaoke",
    "label": "Karaoke",
    "accent": "#F6DE43",
    "background": "#2D2D2D",
    "sheets": [
      {
        "label": "Karaoke · Kantahan",
        "video": true,
        "sections": [
          {
            "title": "Open mic",
            "items": [
              {
                "name": "Saturday open mic",
                "desc": "Every Saturday, 5pm – 11pm. Pick a song, grab the mic."
              }
            ]
          },
          {
            "title": "Private karaoke",
            "boxed": true,
            "items": [
              {
                "name": "Book the karaoke space",
                "desc": "Large space available for groups and parties.",
                "note": "Ask us about capacity and minimum spend."
              }
            ]
          },
          {
            "title": "Drinks",
            "items": [
              {
                "name": "Cocktails & soft drinks",
                "desc": "The full À la carte drinks list is served all night."
              },
              {
                "name": "Bottomless (brunch only)",
                "price": "23 pp",
                "desc": "Unlimited cocktails or bubbles · 1.5 hours"
              }
            ]
          }
        ],
        "karaoke": "Book the room · Open mic Saturdays 5–11pm"
      }
    ]
  }
];
