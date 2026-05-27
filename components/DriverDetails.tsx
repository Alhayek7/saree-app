// // components/DriverDetails.tsx (أضف هذا الجزء)
// import { useFavorites } from '@/context/FavoritesContext';

// export function DriverDetails({ driver, onClose }: { driver: any; onClose: () => void }) {
//   const { addFavorite, isFavorite, canAddMore } = useFavorites();
//   const [isAdding, setIsAdding] = useState(false);

//   const handleAddToFavorites = async () => {
//     if (!canAddMore) {
//       alert(`لا يمكنك إضافة أكثر من 5 سائقين مفضلين`);
//       return;
//     }

//     setIsAdding(true);
//     await addFavorite({
//       id: driver.id,
//       name: driver.name,
//       rating: driver.rating,
//       completedOrdersWithMe: driver.completedOrdersWithMe || 0,
//       phone: driver.phone,
//     });
//     setIsAdding(false);
//     alert(`تم إرسال طلب إضافة ${driver.name} إلى مفضلاتك. في انتظار موافقته.`);
//     onClose();
//   };

//   return (
//     <View>
//       {/* باقي محتوى تفاصيل السائق */}
      
//       {!isFavorite(driver.id) && (
//         <TouchableOpacity 
//           onPress={handleAddToFavorites}
//           disabled={isAdding}
//           style={styles.favoriteButton}>
//           <Text>⭐ أضف إلى مفضلاتي</Text>
//         </TouchableOpacity>
//       )}
      
//       {isFavorite(driver.id) && (
//         <View style={styles.favoriteBadge}>
//           <Text>✅ هذا السائق في مفضلاتك</Text>
//         </View>
//       )}
//     </View>
//   );
// }