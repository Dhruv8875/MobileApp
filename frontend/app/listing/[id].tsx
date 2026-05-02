import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking, Alert, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart, Share2, MapPin, Phone, MessageCircle, Wifi, Car, Snowflake, Bath, Coffee, Users, Flag, Star } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Button, Pill, Card } from '../../src/ui';
import { api, useAuth } from '../../src/api';

const W = Dimensions.get('window').width;
const PLACEHOLDER = 'https://images.unsplash.com/photo-1750420556288-d0e32a6f517b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3IlMjBpbmRpYXxlbnwwfHx8fDE3Nzc3MTcwMjF8MA&ixlib=rb-4.1.0&q=85';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refresh } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => { (async () => {
    try { const { data } = await api.get(`/listings/${id}`); setItem(data); }
    catch { Alert.alert('Error', 'Listing not found'); router.back(); }
  })(); }, [id]);

  if (!item) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colors.bg }}><ActivityIndicator color={Colors.primary} /></View>;

  const photos = item.photos?.length ? item.photos : [PLACEHOLDER];
  const phone = item.owner?.phone || '';
  const isFav = user?.favorites?.includes(item.id);

  const lead = async (type: 'call' | 'whatsapp' | 'callback') => {
    try { await api.post(`/listings/${item.id}/lead`, { type }); } catch {}
  };
  const onCall = () => { if (!phone) return Alert.alert('No phone'); lead('call'); Linking.openURL(`tel:${phone}`); };
  const onWA = () => { if (!phone) return Alert.alert('No phone'); lead('whatsapp'); Linking.openURL(`https://wa.me/91${phone.replace(/\D/g, '')}?text=Hi, I'm interested in your Roomzy listing: ${item.title}`); };
  const onCallback = () => { lead('callback'); Alert.alert('Requested!', 'Owner will call you back soon.'); };
  const onShare = async () => { await Share.share({ message: `Check out this home on Roomzy: ${item.title} — ₹${item.monthlyRent}/mo at ${item.area}, ${item.city}` }); };
  const onFav = async () => { if (!user) return router.push('/login'); await api.post(`/users/favorites/${item.id}`); refresh(); };
  const onReport = () => {
    Alert.alert('Report this listing?', 'Help us keep Roomzy safe.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report fake', onPress: async () => { try { await api.post(`/listings/${item.id}/report`, { reason: 'fake' }); Alert.alert('Reported'); } catch (e: any) { Alert.alert('Error', e?.message); } } },
    ]);
  };

  const Amenity = ({ ok, icon, label }: any) => ok ? (
    <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      {icon}<Text style={{ color: Colors.text }}>{label}</Text>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}>
            {photos.map((p: string, i: number) => (
              <Image key={i} source={{ uri: p }} style={{ width: W, height: 320 }} />
            ))}
          </ScrollView>
          <View style={{ position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
            {photos.map((_: any, i: number) => (
              <View key={i} style={{ width: i === idx ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.6)' }} />
            ))}
          </View>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md }}>
              <RoundBtn onPress={() => router.back()} testID="detail-back"><ArrowLeft size={20} color={Colors.text} /></RoundBtn>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <RoundBtn onPress={onShare} testID="share-btn"><Share2 size={18} color={Colors.text} /></RoundBtn>
                {user?.role === 'tenant' && (
                  <RoundBtn onPress={onFav} testID="fav-btn"><Heart size={18} color={isFav ? Colors.primary : Colors.text} fill={isFav ? Colors.primary : 'transparent'} /></RoundBtn>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={{ padding: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {item.isFeatured && <Pill text="⭐ FEATURED" bg={Colors.primaryLight} color={Colors.primary} />}
            <Pill text={item.propertyType.toUpperCase()} bg={Colors.bgAlt} color={Colors.text} />
            <Pill text={item.preferredTenant} bg={Colors.bgAlt} color={Colors.text} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 }}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
            <MapPin size={14} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted }}>{item.address}, {item.area}, {item.city} {item.pincode}</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.text, marginTop: 14 }}>₹{item.monthlyRent.toLocaleString('en-IN')}<Text style={{ fontSize: 14, color: Colors.textMuted, fontWeight: '400' }}>  /month</Text></Text>

          {item.description ? (
            <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
              <Text style={{ fontWeight: '800', color: Colors.text, marginBottom: 6 }}>About this place</Text>
              <Text style={{ color: Colors.text, lineHeight: 22 }}>{item.description}</Text>
            </Card>
          ) : null}

          <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
            <Text style={{ fontWeight: '800', color: Colors.text, marginBottom: 10 }}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Amenity ok={item.amenities?.wifi} icon={<Wifi size={18} color={Colors.text} />} label="WiFi" />
              <Amenity ok={item.amenities?.ac} icon={<Snowflake size={18} color={Colors.text} />} label="AC" />
              <Amenity ok={item.amenities?.parking} icon={<Car size={18} color={Colors.text} />} label="Parking" />
              <Amenity ok={item.amenities?.attachedBathroom} icon={<Bath size={18} color={Colors.text} />} label="Attached bath" />
              <Amenity ok={item.amenities?.foodAvailable} icon={<Coffee size={18} color={Colors.text} />} label="Food included" />
              <Amenity ok={item.amenities?.roommateAllowed} icon={<Users size={18} color={Colors.text} />} label="Roommate allowed" />
            </View>
          </Card>

          <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
            <Text style={{ fontWeight: '800', color: Colors.text, marginBottom: 10 }}>Pricing details</Text>
            <Row label="Monthly rent" value={`₹${item.monthlyRent.toLocaleString('en-IN')}`} />
            <Row label="Security deposit" value={item.securityDepositRequired ? `₹${item.depositAmount?.toLocaleString('en-IN') || 0}` : 'None'} />
            <Row label="Advance months" value={String(item.advanceMonths || 0)} />
            <Row label="Maintenance" value={item.maintenanceCharge ? `₹${item.maintenanceCharge}/mo` : 'None'} />
            <Row label="Furnishing" value={item.furnishing} />
            <Row label="Available beds" value={String(item.availableBeds || 1)} />
          </Card>

          <Card style={{ marginTop: Spacing.md, padding: Spacing.md }}>
            <Text style={{ fontWeight: '800', color: Colors.text, marginBottom: 12 }}>Contact owner</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: 'https://images.pexels.com/photos/12903019/pexels-photo-12903019.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>{item.owner?.name || 'Owner'}</Text>
                  {item.owner?.isVerifiedOwner && <Star size={14} color={Colors.primary} fill={Colors.primary} />}
                </View>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Property owner</Text>
              </View>
            </View>
            {user?.role !== 'owner' && (
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 }}>
                {phone ? (
                  <TouchableOpacity onPress={onCall} testID="owner-phone-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color={Colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.4 }}>PHONE</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>+91 {phone}</Text>
                    </View>
                    <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>TAP TO CALL</Text>
                  </TouchableOpacity>
                ) : null}
                {item.owner?.email ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.owner.email}?subject=Roomzy - ${item.title}`)} testID="owner-email-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={16} color={Colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.4 }}>EMAIL</Text>
                      <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>{item.owner.email}</Text>
                    </View>
                    <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>TAP TO MAIL</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </Card>

          <TouchableOpacity onPress={onReport} testID="report-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, alignSelf: 'flex-start' }}>
            <Flag size={14} color={Colors.textMuted} /><Text style={{ color: Colors.textMuted, fontSize: 13 }}>Report this listing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {user?.role !== 'owner' && (
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <View style={{ flexDirection: 'row', gap: 8, padding: Spacing.md }}>
            <TouchableOpacity onPress={onCall} testID="cta-call" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bgAlt, paddingVertical: 14, borderRadius: Radius.lg }}>
              <Phone size={18} color={Colors.text} /><Text style={{ fontWeight: '700', color: Colors.text }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onWA} testID="cta-whatsapp" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25D366', paddingVertical: 14, borderRadius: Radius.lg }}>
              <MessageCircle size={18} color="#fff" /><Text style={{ fontWeight: '700', color: '#fff' }}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCallback} testID="cta-callback" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.lg }}>
              <Text style={{ fontWeight: '700', color: '#fff' }}>Callback</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function Row({ label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: Colors.textMuted }}>{label}</Text>
      <Text style={{ color: Colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
function RoundBtn({ children, onPress, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </TouchableOpacity>
  );
}
