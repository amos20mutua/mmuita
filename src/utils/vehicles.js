export const vehicleOptions = [
  {
    id: 'e_bike_standard',
    name: 'Normal Electric Bike',
    fit: 'Documents and small parcels',
    multiplier: 1,
    extra: 0,
    etaBiasMin: 0
  },
  {
    id: 'e_bike_box',
    name: 'E-Bike With Parcel Box',
    fit: 'Medium parcels and secure box transport',
    multiplier: 1.15,
    extra: 120,
    etaBiasMin: 3
  },
  {
    id: 'e_tuktuk',
    name: 'Electric Three-Wheel Tuk-Tuk',
    fit: 'Bulkier deliveries and multi-item drops',
    multiplier: 1.45,
    extra: 260,
    etaBiasMin: 8
  }
]

export const vehicleById = (id) => vehicleOptions.find((v) => v.id === id) || vehicleOptions[0]
