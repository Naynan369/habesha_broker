import {
	Box,
	Button,
	Checkbox,
	CheckboxGroup,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Grid,
	Heading,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import { InputField } from "@components/dashboard/forms/InputField";
import { ListingWizardProgress } from "@components/dashboard/forms/ListingWizardProgress";
import { SellerContactStep, useSellerContact } from "@components/dashboard/forms/SellerContactStep";
import { SellerTypeField } from "@components/dashboard/forms/SellerTypeField";
import { MAX_PHOTOS, PHOTO_ACCEPT, photoSchema, useListingPhotos } from "@components/dashboard/forms/ListingPhotos";
import { useLang } from "@libs/hooks/useLang";
import { uploadMediaFiles } from "@libs/helpers/uploadMedia.client";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { MdArrowBack, MdArrowForward, MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";

const HOUSE_FEATURES = [
	"PARKING", "ELECTRICITY", "WATER", "INTERNET", "SECURITY", "ELEVATOR",
	"BALCONY", "COMPOUND", "GENERATOR", "GYM", "SWIMMING_POOL", "GARDEN",
];
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const optionalNumber = () => yup.number()
	.transform((value, originalValue) => originalValue === "" || originalValue == null ? undefined : value)
	.nullable()
	.notRequired();

const createHouseSchema = (copy: ReturnType<typeof useLang>["businessListing"]) => yup.object().shape({
	title: yup.string().trim().min(5, "Use at least 5 characters").max(300, "Keep the title under 300 characters").required("A listing title is required"),
	sellerType: yup.string().oneOf(["OWNER", "AUTHORIZED_AGENT", "BROKER"]).required("Choose your role for this listing"),
	sellerAttested: yup.boolean().oneOf([true], "Confirm that you are authorized to post this listing"),
	description: yup.string().max(10000, "Keep the description under 10,000 characters"),
	price: yup.number().typeError("Enter a valid price").min(1, "Price must be greater than zero").required("A price is required"),
	priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required("Choose a price type"),
	type: yup.string().oneOf(["RENT", "FORSALE"]).required("Choose rent or sale"),
	priceFrequency: yup.string().when("type", {
		is: "RENT",
		then: (schema) => schema.oneOf(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).required("Choose how often rent is charged"),
		otherwise: (schema) => schema.notRequired(),
	}),
	propertyType: yup.string().oneOf(["APARTMENT", "DETACHED_HOUSE", "VILLA", "CONDOMINIUM", "TOWNHOUSE", "LAND", "OTHER"]).required("Choose a property type"),
	area: yup.number().typeError("Enter the area in square metres").moreThan(0, "Area must be greater than zero").required("Floor area is required"),
	room: optionalNumber().integer("Use a whole number").min(1, "Use at least one room"),
	bedrooms: optionalNumber().integer("Use a whole number").min(0, "Bedrooms cannot be negative").max(100, "Check the bedroom count"),
	bathrooms: optionalNumber().integer("Use a whole number").min(0, "Bathrooms cannot be negative").max(100, "Check the bathroom count"),
	floor: optionalNumber().integer("Use a whole number").min(0, "Floor cannot be negative"),
	totalFloors: optionalNumber().integer("Use a whole number").min(1, "A building must have at least one floor"),
	furnishing: yup.string().oneOf(["", "FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"]),
	region: yup.string().trim().max(100).required("Region is required"),
	city: yup.string().trim().max(100).required("City or town is required"),
	subcity: yup.string().max(100),
	woreda: yup.string().max(100),
	neighborhood: yup.string().max(120),
	landmark: yup.string().max(120),
	features: yup.array().of(yup.string().oneOf(HOUSE_FEATURES)).max(HOUSE_FEATURES.length),
	files: photoSchema({ required: copy.photosRequired, tooMany: copy.wizard.maxPhotos, tooLarge: copy.photoSizeError, wrongType: copy.photoTypeError }),
	video: yup.mixed().nullable()
		.test("video-size", "The video must be 25 MB or smaller", (file: any) => !file || file.size <= MAX_VIDEO_SIZE)
		.test("video-type", "Use an MP4, WebM, or MOV video", (file: any) => !file || ALLOWED_VIDEO_TYPES.includes(file.type)),
});

export const HouseAddForm = ({ user }: { user?: { id: string } }) => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const common = lang.businessListing;
	const sellerTypeText = lang.sellerType;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const [uploadProgress, setUploadProgress] = useState(0);
		const [videoPreview, setVideoPreview] = useState<string | null>(null);
	const [step, setStep] = useState(0);
	const { previews, photoInputRef, choosePhotos, removePhoto } = useListingPhotos({ required: common.photosRequired, tooMany: common.wizard.maxPhotos, tooLarge: common.photoSizeError, wrongType: common.photoTypeError });
	const sellerContact = useSellerContact(user?.id || "");
		const videoPreviewRef = useRef(videoPreview);
		useEffect(() => {
		videoPreviewRef.current = videoPreview;
	}, [videoPreview]);
	useEffect(() => () => {
		if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
	}, []);

	const steps = common.wizard.steps as string[];
	const hints = common.wizard.hints as string[];
	const fieldsByStep = [
		["title", "sellerType", "sellerAttested", "price", "priceType", "type", "priceFrequency"],
		["propertyType", "area", "room", "bedrooms", "bathrooms", "floor", "totalFloors", "furnishing", "features"],
		["region", "city", "subcity", "woreda", "neighborhood", "landmark", "description"],
		["files"],
	];

	const onSubmit = async (values: any, actions: any) => {
		try {
			if (!user?.id) throw new Error("Please sign in again before uploading photos.");
			await sellerContact.ensureContact();
			const { files, video, ...fields } = values;
			const uploads = await uploadMediaFiles({
				files: [...files.map((file: File) => ({ file, mediaKind: "image" as const })), ...(video ? [{ file: video as File, mediaKind: "video" as const }] : [])],
				userId: user.id,
				purpose: "listing",
				itemType: "HOUSE",
				onProgress: setUploadProgress,
			});
			const images = uploads.slice(0, files.length);
			const videoUrl = video ? uploads[uploads.length - 1] : null;
			const response = await axios.post("/api/items/add", { ...fields, images, video: videoUrl });
			setUploadProgress(100);
			toast({ title: common.successTitle, status: "success", description: response.data.msg, isClosable: true });
			await router.push(`/items/${response.data.itemId}`);
		} catch (error: any) {
			const message = error?.response?.data?.err || error?.message || common.submitError;
			toast({ title: common.errorTitle, status: "error", description: message, isClosable: true });
		} finally {
			actions.setSubmitting(false);
		}
	};

	const nextStep = async (formik: any) => {
		const errors = await formik.validateForm();
		const touched = { ...formik.touched };
		fieldsByStep[step].forEach((field) => { touched[field] = true; });
		formik.setTouched(touched, false);
		if (fieldsByStep[step].some((field) => errors[field])) return;
		if (step === 2) {
			try {
				await sellerContact.ensureContact();
			} catch (error: any) {
				toast({ title: common.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || common.submitError, isClosable: true });
				return;
			}
		}
		setStep((current) => Math.min(current + 1, steps.length - 1));
	};

	const chooseVideo = (event: ChangeEvent<HTMLInputElement>, formik: any) => {
		const file = event.currentTarget.files?.[0] || null;
		event.currentTarget.value = "";
		if (!file) return;
		if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
			toast({ title: common.video, description: common.videoTypeError, status: "warning", isClosable: true });
			return;
		}
		if (file.size > MAX_VIDEO_SIZE) {
			toast({ title: common.video, description: common.videoSizeError, status: "warning", isClosable: true });
			return;
		}
		if (videoPreview) URL.revokeObjectURL(videoPreview);
		setVideoPreview(URL.createObjectURL(file));
		formik.setFieldError("video", undefined);
		formik.setFieldValue("video", file);
		formik.setFieldTouched("video", true, false);
	};

	const removeVideo = (formik: any) => {
		if (videoPreview) URL.revokeObjectURL(videoPreview);
		setVideoPreview(null);
		formik.setFieldValue("video", null);
		formik.setFieldTouched("video", true, false);
	};

	return (
		<Formik initialValues={{
			title: "", sellerType: "", sellerAttested: false, description: "", price: "", priceType: "FIXED", itemType: "HOUSE", files: [],
			type: "FORSALE", priceFrequency: "", propertyType: "", area: "", room: "", bedrooms: "", bathrooms: "",
			floor: "", totalFloors: "", furnishing: "", region: "", city: "", subcity: "", woreda: "", neighborhood: "", landmark: "", features: [], video: null,
		}} validationSchema={createHouseSchema(common)} onSubmit={onSubmit} validateOnBlur>
			{(formik) => (
				<form className="dashboard-listing-form" onSubmit={formik.handleSubmit}>
					<Modal closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}} isOpen={formik.isSubmitting}>
						<ModalOverlay />
						<ModalContent p="10">
							<ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
								<CircularProgress size="150px" value={uploadProgress}><CircularProgressLabel>{uploadProgress}%</CircularProgressLabel></CircularProgress>
								<Heading mt="4" fontSize="lg">{common.uploading}</Heading>
							</ModalBody>
						</ModalContent>
					</Modal>

					<ListingWizardProgress steps={steps} hints={hints} activeStep={step} stepLabel={common.wizard.step} ofLabel={common.wizard.of} />

					{step === 0 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={common.title} name="title" placeholder={common.titleHint} helperText={common.titleHelp} required />
						<SellerTypeField formik={formik} itemType="HOUSE" />
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
							<InputField formik={formik} label={common.price} name="price" type="number" placeholder={common.priceHint} suffix={<Text>ETB</Text>} required />
							<SelectField formik={formik} name="priceType" label={common.priceType} options={[["FIXED", common.fixed], ["NEGOTIABLE", common.negotiable]]} required />
							<SelectField formik={formik} name="type" label={common.rentOrSale} options={[["FORSALE", common.sale], ["RENT", common.rent]]} required />
							{formik.values.type === "RENT" && <SelectField formik={formik} name="priceFrequency" label={common.priceFrequency} options={Object.entries(common.frequencies)} required />}
						</SimpleGrid>
					</Flex>}

					{step === 1 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
							<SelectField formik={formik} name="propertyType" label={common.propertyType} options={Object.entries(common.propertyTypes)} required />
							<InputField formik={formik} label={common.floorArea} name="area" type="number" placeholder="e.g. 120" suffix={<Text>m²</Text>} required />
							<InputField formik={formik} label={common.rooms} name="room" type="number" placeholder="e.g. 5" />
							{formik.values.propertyType !== "LAND" && <>
								<InputField formik={formik} label={common.bedrooms} name="bedrooms" type="number" placeholder="e.g. 3" />
								<InputField formik={formik} label={common.bathrooms} name="bathrooms" type="number" placeholder="e.g. 2" />
								<InputField formik={formik} label={common.floor} name="floor" type="number" placeholder="e.g. 2" />
								<InputField formik={formik} label={common.totalFloors} name="totalFloors" type="number" placeholder="e.g. 4" />
								<SelectField formik={formik} name="furnishing" label={common.furnishing} options={Object.entries(common.furnishingTypes)} allowBlank />
							</>}
						</SimpleGrid>
						<Box>
							<FormControl isInvalid={Boolean(formik.touched.features && formik.errors.features)}>
								<FormLabel mb="3">{common.features}</FormLabel>
								<CheckboxGroup colorScheme="orange" value={formik.values.features} onChange={(value) => formik.setFieldValue("features", value)}>
									<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing="3" p={{ base: 4, md: 5 }} border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
										{Object.entries(common.homeFeatures).map(([value, label]) => <Checkbox key={value} value={value}>{label}</Checkbox>)}
									</SimpleGrid>
								</CheckboxGroup>
							</FormControl>
						</Box>
					</Flex>}

					{step === 2 && <Flex direction="column" gap="5">
						<Text color={muted} fontSize="sm">{common.locationStepHint}</Text>
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<InputField formik={formik} label={common.region} name="region" placeholder={common.regionHint} required />
							<InputField formik={formik} label={common.city} name="city" placeholder={common.cityHint} required />
							<InputField formik={formik} label={common.subcity} name="subcity" placeholder={common.subcity} />
							<InputField formik={formik} label={common.woreda} name="woreda" placeholder={common.woreda} />
							<InputField formik={formik} label={common.neighborhood} name="neighborhood" placeholder={common.neighborhood} />
							<InputField formik={formik} label={common.landmark} name="landmark" placeholder={common.landmarkHint} />
						</SimpleGrid>
						<FormControl isInvalid={Boolean(formik.touched.description && formik.errors.description)}>
							<FormLabel htmlFor="description">{common.description}</FormLabel>
							<Textarea id="description" name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder={common.descriptionHint} variant="filled" minH="36" maxLength={10000} />
							<FormErrorMessage>{String(formik.errors.description || "")}</FormErrorMessage>
						</FormControl>
						<SellerContactStep contact={sellerContact} />
					</Flex>}

					{step === 3 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
							<ReviewCard label={common.title} value={formik.values.title || "—"} />
							<ReviewCard label={sellerTypeText.label} value={sellerTypeText.options[formik.values.sellerType] || "—"} />
							<ReviewCard label={common.wizard.priceLabel} value={formik.values.price ? `ETB ${Number(formik.values.price).toLocaleString("en-US")}` : "—"} />
							<ReviewCard label={common.propertyType} value={(common.propertyTypes as Record<string, string>)[formik.values.propertyType] || "—"} />
							<ReviewCard label={common.rentOrSale} value={formik.values.type === "RENT" ? common.rent : common.sale} />
							{formik.values.type === "RENT" && <ReviewCard label={common.priceFrequency} value={(common.frequencies as Record<string, string>)[formik.values.priceFrequency] || "—"} />}
							<ReviewCard label={common.floorArea} value={formik.values.area ? `${Number(formik.values.area).toLocaleString("en-US")} m²` : "—"} />
							<ReviewCard label={common.rooms} value={formik.values.room || "—"} />
							<ReviewCard label={common.video} value={formik.values.video ? common.videoAttached : common.videoNotAdded} />
							{formik.values.propertyType !== "LAND" && <>
								<ReviewCard label={common.bedrooms} value={formik.values.bedrooms || "—"} />
								<ReviewCard label={common.bathrooms} value={formik.values.bathrooms || "—"} />
								<ReviewCard label={common.furnishing} value={(common.furnishingTypes as Record<string, string>)[formik.values.furnishing] || "—"} />
							</>}
							<ReviewCard label={common.city} value={[formik.values.city, formik.values.region].filter(Boolean).join(", ") || "—"} />
						</SimpleGrid>
						<Box p="4" border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
							<Text fontSize="sm" fontWeight="semibold">{common.features}</Text>
							<Text mt="1" color={muted} fontSize="sm">{formik.values.features.length ? formik.values.features.map((feature: string) => (common.homeFeatures as Record<string, string>)[feature]).join(" · ") : "—"}</Text>
						</Box>
						<FormControl isRequired isInvalid={Boolean(formik.touched.files && formik.errors.files)}>
							<Flex align="center" justify="space-between" gap="3" wrap="wrap">
								<FormLabel htmlFor="house-photos" mb="0">{common.photos}</FormLabel>
								<Text fontSize="xs" color={muted}>{formik.values.files.length}/{MAX_PHOTOS} {common.wizard.photosCount}</Text>
							</Flex>
							<Text color={muted} fontSize="sm" mt="2" mb="3">{common.wizard.photoHelp}</Text>
								<Input ref={photoInputRef} id="house-photos" onChange={(event) => choosePhotos(event, formik)} variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} type="file" name="files" accept={PHOTO_ACCEPT} multiple />
							<FormErrorMessage>{String(formik.errors.files || "")}</FormErrorMessage>
						</FormControl>
						<FormControl isInvalid={Boolean(formik.touched.video && formik.errors.video)}>
							<Flex align="center" justify="space-between" gap="3" wrap="wrap">
								<FormLabel htmlFor="house-video" mb="0">{common.video}</FormLabel>
								<Text fontSize="xs" color={muted}>{common.optional}</Text>
							</Flex>
							<Text color={muted} fontSize="sm" mt="2" mb="3">{common.videoHelp}</Text>
							<Input id="house-video" onChange={(event) => chooseVideo(event, formik)} variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} type="file" name="video" accept="video/mp4,video/webm,video/quicktime" />
							<FormErrorMessage>{String(formik.errors.video || "")}</FormErrorMessage>
						</FormControl>
						{videoPreview && formik.values.video && <Box p="4" border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
							<Flex align="center" justify="space-between" gap="3" mb="3" wrap="wrap">
								<Text fontSize="sm" fontWeight="semibold" wordBreak="break-word">{formik.values.video.name}</Text>
								<Button type="button" size="sm" variant="outline" leftIcon={<MdClose />} onClick={() => removeVideo(formik)}>{common.removeVideo}</Button>
							</Flex>
							<video aria-label={common.videoPreview} controls preload="metadata" src={videoPreview} style={{ width: "100%", maxHeight: 340, borderRadius: 12, background: "#000000" }} />
						</Box>}
						<Grid templateColumns="repeat(auto-fill, minmax(145px, 1fr))" gap="4">
							{formik.values.files.map((file: File, index: number) => <Box key={`${file.name}-${index}`} position="relative" overflow="hidden" borderRadius="xl" border="1px solid" borderColor={panelBorder}>
								<Image alt={`${common.photoPreview} ${index + 1}`} w="full" h="150px" objectFit="cover" src={previews[index]} />
								<Button aria-label={`${common.removePhoto} ${index + 1}`} position="absolute" top="2" right="2" size="sm" minW="8" h="8" p="0" borderRadius="full" onClick={() => removePhoto(index, formik)}><MdClose /></Button>
							</Box>)}
						</Grid>
					</Flex>}

					<Flex justify="space-between" align="center" gap="3" mt={{ base: 6, md: 8 }} pt="5" borderTop="1px solid" borderColor={panelBorder}>
						<Button type="button" variant="ghost" onClick={() => router.push("/dashboard")} leftIcon={<MdClose />} display="inline-flex">{common.cancel}</Button>
						<Flex ml="auto" gap="3">
							{step > 0 && <Button type="button" variant="outline" leftIcon={<MdArrowBack />} onClick={() => setStep((current) => current - 1)}>{common.wizard.back}</Button>}
							{step < steps.length - 1 ? <Button type="button" colorScheme="orange" rightIcon={<MdArrowForward />} onClick={() => nextStep(formik)}>{common.wizard.next}</Button> : <Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting} isDisabled={sellerContact.loading || sellerContact.loadError}>{common.submit}</Button>}
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};

function SelectField({ formik, name, label, options, allowBlank = false, required = false }: { formik: any; name: string; label: string; options: Array<[string, string]>; allowBlank?: boolean; required?: boolean }) {
	return <FormControl isRequired={required} isInvalid={Boolean(formik.touched[name] && formik.errors[name])}>
		<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">{label}</FormLabel>
		<Select id={name} name={name} value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur} variant="filled" h="12" placeholder="—">
			{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
		</Select>
		<FormErrorMessage>{String(formik.errors[name] || "")}</FormErrorMessage>
	</FormControl>;
}

function ReviewCard({ label, value }: { label: string; value: string | number }) {
	const bg = useColorModeValue("gray.50", "whiteAlpha.50");
	const muted = useColorModeValue("gray.600", "gray.400");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	return <Box minW="0" p="4" bg={bg} border="1px solid" borderColor={border} borderRadius="xl">
		<Text fontSize="xs" fontWeight="semibold" color={muted}>{label}</Text>
		<Text mt="1" fontWeight="semibold" wordBreak="break-word">{value || "—"}</Text>
	</Box>;
}
