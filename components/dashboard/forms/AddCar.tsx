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
import { ListingWizardProgress } from "@components/dashboard/forms/ListingWizardProgress";
import { InputField } from "@components/dashboard/forms/InputField";
import { SellerContactStep, useSellerContact } from "@components/dashboard/forms/SellerContactStep";
import { SellerTypeField } from "@components/dashboard/forms/SellerTypeField";
import { MAX_PHOTOS, PHOTO_ACCEPT, photoSchema, useListingPhotos } from "@components/dashboard/forms/ListingPhotos";
import { useLang } from "@libs/hooks/useLang";
import { uploadMediaFiles } from "@libs/helpers/uploadMedia.client";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdArrowBack, MdArrowForward, MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";

const CAR_FEATURES = [
	"AIR_CONDITIONING", "AIRBAGS", "ABS", "REAR_CAMERA", "PARKING_SENSORS", "SUNROOF",
	"ALLOY_WHEELS", "CRUISE_CONTROL", "POWER_WINDOWS", "POWER_STEERING", "BLUETOOTH", "SPARE_TIRE",
];

const optionalNumber = () => yup.number()
	.transform((value, originalValue) => originalValue === "" || originalValue == null ? undefined : value)
	.nullable()
	.notRequired();

const createCarSchema = (copy: ReturnType<typeof useLang>["businessListing"]) => yup.object().shape({
	title: yup.string().trim().min(5, "Use at least 5 characters").max(300, "Keep the title under 300 characters").required("A listing title is required"),
	sellerType: yup.string().oneOf(["OWNER", "DEALER_RETAILER", "BROKER"]).required("Choose your role for this listing"),
	sellerAttested: yup.boolean().oneOf([true], "Confirm that you are authorized to post this listing"),
	description: yup.string().max(10000, "Keep the description under 10,000 characters"),
	price: yup.number().typeError("Enter a valid price").min(1, "Price must be greater than zero").required("A price is required"),
	priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required("Choose a price type"),
	files: photoSchema({ required: copy.photosRequired, tooMany: copy.wizard.maxPhotos, tooLarge: copy.photoSizeError, wrongType: copy.photoTypeError }),
	status: yup.string().oneOf(["USED", "NEW", "NEW_ETH"]).required("Choose the vehicle condition"),
	manufacturer: yup.string().trim().max(100).required("Manufacturer is required"),
	model: yup.string().trim().max(100).required("Model is required"),
	year: yup.number().typeError("Enter a valid year").integer("Use a whole year").min(1950, "Enter a year after 1950").max(new Date().getFullYear() + 2, "That year is too far in the future").required("Year is required"),
	transmition: yup.string().oneOf(["AUTO", "MANUAL"]).required("Choose the transmission"),
	color: yup.string().max(50),
	cylinder: optionalNumber().min(0, "Engine size cannot be negative"),
	fuel: optionalNumber().min(0, "Fuel consumption cannot be negative"),
	fuelType: yup.string().oneOf(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"]).required("Choose the fuel type"),
	bodyType: yup.string().oneOf(["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "MINIBUS", "COUPE", "WAGON", "TRUCK", "OTHER"]).required("Choose the body style"),
	driveType: yup.string().oneOf(["FWD", "RWD", "AWD", "FOUR_WD", "OTHER"]).required("Choose the drivetrain"),
	mileage: optionalNumber().integer("Use a whole number of kilometres").min(0, "Mileage cannot be negative"),
	seats: optionalNumber().integer("Use a whole number").min(1, "A vehicle must have at least one seat").max(100, "Check the seat count"),
	doors: optionalNumber().integer("Use a whole number").min(1, "A vehicle must have at least one door").max(10, "Check the door count"),
	region: yup.string().trim().max(100).required("Region is required"),
	city: yup.string().trim().max(100).required("City or town is required"),
	subcity: yup.string().max(100),
	neighborhood: yup.string().max(120),
	landmark: yup.string().max(120),
	features: yup.array().of(yup.string().oneOf(CAR_FEATURES)).max(CAR_FEATURES.length),
});

export const AddCar = ({ user }: { user?: { id: string } }) => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const common = lang.businessListing;
	const text = lang.vehicleListing;
	const sellerTypeText = lang.sellerType;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const [uploadProgress, setUploadProgress] = useState(0);
		const [step, setStep] = useState(0);
	const { previews, photoInputRef, choosePhotos, removePhoto } = useListingPhotos({ required: common.photosRequired, tooMany: common.wizard.maxPhotos, tooLarge: common.photoSizeError, wrongType: common.photoTypeError });
	const sellerContact = useSellerContact(user?.id || "");

	const steps = common.wizard.steps as string[];
	const hints = common.wizard.hints as string[];
	const fieldsByStep = [
		["title", "sellerType", "sellerAttested", "price", "priceType", "status", "manufacturer", "model", "year"],
		["bodyType", "transmition", "fuelType", "driveType", "color", "cylinder", "fuel", "mileage", "seats", "doors", "features"],
		["region", "city", "subcity", "neighborhood", "landmark", "description"],
		["files"],
	];

	const onSubmit = async (values: any, actions: any) => {
		try {
			if (!user?.id) throw new Error("Please sign in again before uploading photos.");
			await sellerContact.ensureContact();
			const { files, ...fields } = values;
			const images = await uploadMediaFiles({ files: files.map((file: File) => ({ file, mediaKind: "image" as const })), userId: user.id, purpose: "listing", itemType: "CAR", onProgress: setUploadProgress });
			const response = await axios.post("/api/items/add", { ...fields, images });
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

	return (
		<Formik initialValues={{
			title: "", sellerType: "", sellerAttested: false, description: "", price: "", priceType: "FIXED", itemType: "CAR", files: [],
			model: "", status: "USED", manufacturer: "", year: "", transmition: "AUTO", color: "",
			cylinder: "", fuel: "", fuelType: "", bodyType: "", driveType: "", mileage: "", seats: "", doors: "",
			region: "", city: "", subcity: "", neighborhood: "", landmark: "", features: [],
		}} validationSchema={createCarSchema(common)} onSubmit={onSubmit} validateOnBlur>
			{(formik) => (
				<form className="dashboard-listing-form" onSubmit={formik.handleSubmit}>
					<Modal closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}} isOpen={formik.isSubmitting}>
						<ModalOverlay />
						<ModalContent p="10">
							<ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
								<CircularProgress size="150px" value={uploadProgress}><CircularProgressLabel>{uploadProgress}%</CircularProgressLabel></CircularProgress>
								<Heading mt="4" fontSize="lg">{text.uploading}</Heading>
							</ModalBody>
						</ModalContent>
					</Modal>

					<ListingWizardProgress steps={steps} hints={hints} activeStep={step} stepLabel={common.wizard.step} ofLabel={common.wizard.of} />

					{step === 0 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={common.title} name="title" placeholder={text.titleHint} helperText={text.titleHelp} required />
						<SellerTypeField formik={formik} itemType="CAR" />
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
							<InputField formik={formik} label={common.price} name="price" type="number" suffix={<Text>ETB</Text>} required />
							<SelectField formik={formik} name="priceType" label={common.priceType} options={[["FIXED", common.fixed], ["NEGOTIABLE", common.negotiable]]} required />
							<SelectField formik={formik} name="status" label={text.status} options={[["USED", text.used], ["NEW", text.new], ["NEW_ETH", text.newInEthiopia]]} required />
						</SimpleGrid>
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
							<InputField formik={formik} label={text.manufacturer} name="manufacturer" placeholder={text.manufacturerHint} required />
							<InputField formik={formik} label={text.model} name="model" placeholder={text.modelHint} required />
							<InputField formik={formik} label={text.year} name="year" type="number" placeholder="2018" required />
						</SimpleGrid>
					</Flex>}

					{step === 1 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
							<SelectField formik={formik} name="bodyType" label={text.bodyType} options={Object.entries(text.bodyTypes)} required />
							<SelectField formik={formik} name="transmition" label={text.transmission} options={[["AUTO", text.automatic], ["MANUAL", text.manual]]} required />
							<SelectField formik={formik} name="fuelType" label={text.fuelType} options={Object.entries(text.fuelTypes)} required />
							<SelectField formik={formik} name="driveType" label={text.driveType} options={Object.entries(text.driveTypes)} required />
							<InputField formik={formik} label={text.color} name="color" placeholder={text.color} />
							<InputField formik={formik} label={text.cylinder} name="cylinder" type="number" placeholder="e.g. 2.0" suffix={<Text>L</Text>} />
							<InputField formik={formik} label={text.mileage} name="mileage" type="number" placeholder="e.g. 85000" suffix={<Text>{text.mileageUnit}</Text>} />
							<InputField formik={formik} label={text.fuel} name="fuel" type="number" placeholder="e.g. 7.5" suffix={<Text>{text.fuelUnit}</Text>} />
							<InputField formik={formik} label={text.seats} name="seats" type="number" placeholder="e.g. 5" />
							<InputField formik={formik} label={text.doors} name="doors" type="number" placeholder="e.g. 4" />
						</SimpleGrid>
						<Box>
							<FormControl isInvalid={Boolean(formik.touched.features && formik.errors.features)}>
								<FormLabel mb="3">{text.features}</FormLabel>
								<CheckboxGroup colorScheme="orange" value={formik.values.features} onChange={(value) => formik.setFieldValue("features", value)}>
									<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing="3" p={{ base: 4, md: 5 }} border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
										{Object.entries(text.vehicleFeatures).map(([value, label]) => <Checkbox key={value} value={value}>{label}</Checkbox>)}
									</SimpleGrid>
								</CheckboxGroup>
							</FormControl>
						</Box>
					</Flex>}

					{step === 2 && <Flex direction="column" gap="5">
						<Text color={muted} fontSize="sm">{text.locationStepHint}</Text>
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<InputField formik={formik} label={text.region} name="region" placeholder={text.regionHint} required />
							<InputField formik={formik} label={text.city} name="city" placeholder={text.cityHint} required />
							<InputField formik={formik} label={text.subcity} name="subcity" placeholder={text.subcity} />
							<InputField formik={formik} label={text.neighborhood} name="neighborhood" placeholder={text.neighborhood} />
							<InputField formik={formik} label={text.landmark} name="landmark" placeholder={text.landmarkHint} />
						</SimpleGrid>
						<FormControl isInvalid={Boolean(formik.touched.description && formik.errors.description)}>
							<FormLabel htmlFor="description">{common.description}</FormLabel>
							<Textarea id="description" name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder={text.descriptionHint} variant="filled" minH="36" maxLength={10000} />
							<FormErrorMessage>{String(formik.errors.description || "")}</FormErrorMessage>
						</FormControl>
						<SellerContactStep contact={sellerContact} />
					</Flex>}

					{step === 3 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<ReviewCard label={common.title} value={formik.values.title || "—"} />
							<ReviewCard label={sellerTypeText.label} value={sellerTypeText.options[formik.values.sellerType] || "—"} />
							<ReviewCard label={common.wizard.priceLabel} value={formik.values.price ? `ETB ${Number(formik.values.price).toLocaleString("en-US")}` : "—"} />
							<ReviewCard label={text.manufacturer} value={[formik.values.manufacturer, formik.values.model].filter(Boolean).join(" ") || "—"} />
							<ReviewCard label={text.year} value={formik.values.year || "—"} />
							<ReviewCard label={text.status} value={formik.values.status === "USED" ? text.used : formik.values.status === "NEW" ? text.new : text.newInEthiopia} />
							<ReviewCard label={text.bodyType} value={text.bodyTypes[formik.values.bodyType] || "—"} />
							<ReviewCard label={text.fuelType} value={text.fuelTypes[formik.values.fuelType] || "—"} />
							<ReviewCard label={text.transmission} value={formik.values.transmition === "AUTO" ? text.automatic : text.manual} />
							<ReviewCard label={text.city} value={[formik.values.city, formik.values.region].filter(Boolean).join(", ") || "—"} />
							<ReviewCard label={text.mileage} value={formik.values.mileage ? `${Number(formik.values.mileage).toLocaleString("en-US")} ${text.mileageUnit}` : "—"} />
						</SimpleGrid>
						<Box p="4" border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
							<Text fontSize="sm" fontWeight="semibold">{text.features}</Text>
							<Text mt="1" color={muted} fontSize="sm">{formik.values.features.length ? formik.values.features.map((feature: string) => text.vehicleFeatures[feature]).join(" · ") : "—"}</Text>
						</Box>
						<FormControl isRequired isInvalid={Boolean(formik.touched.files && formik.errors.files)}>
							<Flex align="center" justify="space-between" gap="3" wrap="wrap">
								<FormLabel htmlFor="car-photos" mb="0">{common.photos}</FormLabel>
								<Text fontSize="xs" color={muted}>{formik.values.files.length}/{MAX_PHOTOS} {common.wizard.photosCount}</Text>
							</Flex>
							<Text color={muted} fontSize="sm" mt="2" mb="3">{common.wizard.photoHelp}</Text>
								<Input ref={photoInputRef} id="car-photos" onChange={(event) => choosePhotos(event, formik)} variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} type="file" name="files" accept={PHOTO_ACCEPT} multiple />
							<FormErrorMessage>{String(formik.errors.files || "")}</FormErrorMessage>
						</FormControl>
						<Grid templateColumns="repeat(auto-fill, minmax(145px, 1fr))" gap="4">
							{formik.values.files.map((file: File, index: number) => <Box key={`${file.name}-${index}`} position="relative" overflow="hidden" borderRadius="xl" border="1px solid" borderColor={panelBorder}>
								<Image alt={`${common.photoPreview} ${index + 1}`} w="full" h="150px" objectFit="cover" src={previews[index]} />
								<Button aria-label={`${text.removePhoto} ${index + 1}`} position="absolute" top="2" right="2" size="sm" minW="8" h="8" p="0" borderRadius="full" onClick={() => removePhoto(index, formik)}><MdClose /></Button>
							</Box>)}
						</Grid>
					</Flex>}

					<Flex justify="space-between" align="center" gap="3" mt={{ base: 6, md: 8 }} pt="5" borderTop="1px solid" borderColor={panelBorder}>
						<Button type="button" variant="ghost" onClick={() => router.push("/dashboard")} leftIcon={<MdClose />} display="inline-flex">{common.cancel}</Button>
						<Flex ml="auto" gap="3">
							{step > 0 && <Button type="button" variant="outline" leftIcon={<MdArrowBack />} onClick={() => setStep((current) => current - 1)}>{common.wizard.back}</Button>}
							{step < steps.length - 1 ? <Button type="button" colorScheme="orange" rightIcon={<MdArrowForward />} onClick={() => nextStep(formik)}>{common.wizard.next}</Button> : <Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting} isDisabled={sellerContact.loading || sellerContact.loadError}>{text.submit}</Button>}
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};

function SelectField({ formik, name, label, options, required = false }: { formik: any; name: string; label: string; options: Array<[string, string]>; required?: boolean }) {
	return <FormControl isRequired={required} isInvalid={Boolean(formik.touched[name] && formik.errors[name])}>
		<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">{label}</FormLabel>
		<Select id={name} name={name} value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur} variant="filled" h="12" placeholder="—">
			{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
		</Select>
		<FormErrorMessage>{String(formik.errors[name] || "")}</FormErrorMessage>
	</FormControl>;
}

function ReviewCard({ label, value }: { label: string; value: string }) {
	const bg = useColorModeValue("gray.50", "whiteAlpha.50");
	const muted = useColorModeValue("gray.600", "gray.400");
	return <Box minW="0" p="4" bg={bg} border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.200")} borderRadius="xl">
		<Text fontSize="xs" fontWeight="semibold" color={muted}>{label}</Text>
		<Text mt="1" fontWeight="semibold" wordBreak="break-word">{value}</Text>
	</Box>;
}
