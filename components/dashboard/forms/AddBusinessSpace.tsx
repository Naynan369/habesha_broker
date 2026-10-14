import {
	Box,
	Button,
	Checkbox,
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
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useState, type ChangeEvent } from "react";
import { MdArrowBack, MdArrowForward, MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SPACE_TYPES = ["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"];

function createSchema(text: any) {
	return yup.object().shape({
		title: yup.string().trim().min(5, "Use at least 5 characters").max(300, "Keep the title under 300 characters").required("A listing title is required"),
		description: yup.string().max(10000, "Keep the description under 10,000 characters"),
		price: yup.number().typeError("Enter a valid price").min(0, "Price cannot be negative").required("A price is required"),
		priceType: yup.string().oneOf(["FIXED", "NEGOTIABLE"]).required("Choose a price type"),
		type: yup.string().oneOf(["RENT", "FORSALE"]).required("Choose rent or sale"),
		priceFrequency: yup.string().when("type", {
			is: "RENT",
			then: (value) => value.oneOf(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).required("Choose how often rent is charged"),
			otherwise: (value) => value.notRequired(),
		}),
		spaceType: yup.string().oneOf(SPACE_TYPES).required("Choose a space type"),
		area: yup.number().typeError("Enter the floor area").moreThan(0, "Floor area must be greater than zero").required("Floor area is required"),
		region: yup.string().trim().max(100).required("Region is required"),
		city: yup.string().trim().max(100).required("City is required"),
		subcity: yup.string().max(100),
		woreda: yup.string().max(100),
		neighborhood: yup.string().max(120),
		landmark: yup.string().max(120),
		electricity: yup.boolean(),
		water: yup.boolean(),
		roadAccess: yup.boolean(),
		parking: yup.boolean(),
		files: yup.array().of(yup.mixed()).min(1, text.photosRequired).max(MAX_PHOTOS, text.wizard.maxPhotos)
			.test("photo-size", text.photoSizeError, (files: File[]) => !files || files.every((file) => file.size <= MAX_PHOTO_SIZE))
			.test("photo-type", text.photoTypeError, (files: File[]) => !files || files.every((file) => ALLOWED_PHOTO_TYPES.includes(file.type))),
	});
}

export const AddBusinessSpace = () => {
	const router = useRouter();
	const toast = useToast();
	const text = useLang().businessListing;
	const validationSchema = createSchema(text);
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previews, setPreviews] = useState<string[]>([]);
	const [step, setStep] = useState(0);

	useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview)), [previews]);

	const steps = text.wizard.steps as string[];
	const hints = text.wizard.hints as string[];
	const fieldsByStep = [
		["title", "spaceType", "type", "priceType", "price", "priceFrequency"],
		["area", "electricity", "water", "roadAccess", "parking"],
		["region", "city", "subcity", "woreda", "neighborhood", "landmark", "description"],
		["files"],
	];

	const onSubmit = async (values: any, actions: any) => {
		const formData = new FormData();
		const { files, ...fields } = values;
		Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value ?? "")));
		files.forEach((file: File) => formData.append("files", file));

		try {
			const response = await axios.post("/api/items/add", formData, {
				onUploadProgress: (event) => {
					if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
				},
			});
			toast({ title: text.successTitle, status: "success", description: response.data.msg, isClosable: true });
			await router.push("/items/" + response.data.itemId);
		} catch (error: any) {
			toast({ title: text.errorTitle, status: "error", description: error?.response?.data?.err || error?.message || text.submitError, isClosable: true });
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
		setStep((current) => Math.min(current + 1, steps.length - 1));
	};

	const choosePhotos = (event: ChangeEvent<HTMLInputElement>, formik: any) => {
		const chosen = Array.from(event.currentTarget.files || []);
		event.currentTarget.value = "";
		if (chosen.length > MAX_PHOTOS) {
			formik.setFieldError("files", text.wizard.maxPhotos);
			formik.setFieldTouched("files", true, false);
			return;
		}
		if (chosen.some((file) => file.size > MAX_PHOTO_SIZE)) {
			formik.setFieldError("files", text.photoSizeError);
			formik.setFieldTouched("files", true, false);
			return;
		}
		if (chosen.some((file) => !ALLOWED_PHOTO_TYPES.includes(file.type))) {
			formik.setFieldError("files", text.photoTypeError);
			formik.setFieldTouched("files", true, false);
			return;
		}
		setPreviews(chosen.map((file) => URL.createObjectURL(file)));
		formik.setFieldValue("files", chosen);
		formik.setFieldTouched("files", true, false);
	};

	const removePhoto = (index: number, formik: any) => {
		const nextFiles = formik.values.files.filter((_file: File, fileIndex: number) => fileIndex !== index);
		const nextPreviews = previews.filter((_preview, previewIndex) => previewIndex !== index);
		if (previews[index]) URL.revokeObjectURL(previews[index]);
		setPreviews(nextPreviews);
		formik.setFieldValue("files", nextFiles);
		formik.setFieldTouched("files", true, false);
	};

	return (
		<Formik
			initialValues={{
				title: "",
				description: "",
				price: 0,
				priceType: "NEGOTIABLE",
				itemType: "BUSINESS_SPACE",
				files: [],
				type: "RENT",
				priceFrequency: "MONTHLY",
				spaceType: "SHOP",
				area: "",
				region: "",
				city: "",
				subcity: "",
				woreda: "",
				neighborhood: "",
				landmark: "",
				electricity: false,
				water: false,
				roadAccess: false,
				parking: false,
			}}
			onSubmit={onSubmit}
			validationSchema={validationSchema}
			validateOnBlur
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Modal isOpen={formik.isSubmitting} closeOnOverlayClick={false} closeOnEsc={false} onClose={() => {}}>
						<ModalOverlay />
						<ModalContent p="10">
							<ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
								<CircularProgress size="150px" value={uploadProgress}>
									<CircularProgressLabel>{uploadProgress}%</CircularProgressLabel>
								</CircularProgress>
								<Heading mt="4" fontSize="lg">{text.uploading}</Heading>
							</ModalBody>
						</ModalContent>
					</Modal>

					<ListingWizardProgress steps={steps} hints={hints} activeStep={step} stepLabel={text.wizard.step} ofLabel={text.wizard.of} />

					{step === 0 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={text.title} name="title" placeholder={text.titleHint} required />
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<SelectField formik={formik} name="spaceType" label={text.spaceType} options={SPACE_TYPES.map((value) => [value, text.spaceTypes[value]])} required />
							<SelectField formik={formik} name="type" label={text.rentOrSale} options={[["RENT", text.rent], ["FORSALE", text.sale]]} required onChange={(value) => {
								formik.setFieldValue("type", value);
								formik.setFieldValue("priceFrequency", value === "RENT" ? (formik.values.priceFrequency || "MONTHLY") : "");
							}} />
							<SelectField formik={formik} name="priceType" label={text.priceType} options={[["FIXED", text.fixed], ["NEGOTIABLE", text.negotiable]]} required />
							<InputField formik={formik} label={text.price} name="price" type="number" placeholder={text.priceHint} suffix={<Text>ETB</Text>} required />
							{formik.values.type === "RENT" && <SelectField formik={formik} name="priceFrequency" label={text.priceFrequency} options={Object.entries(text.frequencies)} required />}
						</SimpleGrid>
					</Flex>}

					{step === 1 && <Flex direction="column" gap="5">
						<InputField formik={formik} label={text.floorArea} name="area" type="number" placeholder="e.g. 80" suffix={<Text>m²</Text>} required />
						<Box p="5" bg={panelBg} border="1px solid" borderColor={panelBorder} borderRadius="xl">
							<Text fontWeight="semibold" mb="4">{text.facilities}</Text>
							<SimpleGrid columns={{ base: 1, sm: 2 }} spacing="4">
								<Checkbox name="electricity" isChecked={formik.values.electricity} onChange={formik.handleChange}>{text.electricity}</Checkbox>
								<Checkbox name="water" isChecked={formik.values.water} onChange={formik.handleChange}>{text.water}</Checkbox>
								<Checkbox name="roadAccess" isChecked={formik.values.roadAccess} onChange={formik.handleChange}>{text.roadAccess}</Checkbox>
								<Checkbox name="parking" isChecked={formik.values.parking} onChange={formik.handleChange}>{text.parking}</Checkbox>
							</SimpleGrid>
						</Box>
					</Flex>}

					{step === 2 && <Flex direction="column" gap="5">
						<Text color={muted} fontSize="sm">{text.locationStepHint}</Text>
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
							<InputField formik={formik} label={text.region} name="region" placeholder={text.regionHint} required />
							<InputField formik={formik} label={text.city} name="city" placeholder={text.cityHint} required />
							<InputField formik={formik} label={text.subcity} name="subcity" />
							<InputField formik={formik} label={text.woreda} name="woreda" />
							<InputField formik={formik} label={text.neighborhood} name="neighborhood" />
							<InputField formik={formik} label={text.landmark} name="landmark" placeholder={text.landmarkHint} />
						</SimpleGrid>
						<FormControl isInvalid={Boolean(formik.touched.description && formik.errors.description)}>
							<FormLabel htmlFor="description">{text.description}</FormLabel>
							<Textarea id="description" name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder={text.descriptionHint} variant="filled" maxLength={10000} />
							<FormErrorMessage>{String(formik.errors.description || "")}</FormErrorMessage>
						</FormControl>
					</Flex>}

					{step === 3 && <Flex direction="column" gap="5">
						<SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
							<ReviewCard label={text.title} value={formik.values.title || "—"} />
							<ReviewCard label={text.price} value={"ETB " + Number(formik.values.price || 0).toLocaleString("en-US")} />
							<ReviewCard label={text.spaceType} value={text.spaceTypes[formik.values.spaceType] || "—"} />
							<ReviewCard label={text.rentOrSale} value={formik.values.type === "RENT" ? text.rent : text.sale} />
							{formik.values.type === "RENT" && <ReviewCard label={text.priceFrequency} value={text.frequencies[formik.values.priceFrequency] || "—"} />}
							<ReviewCard label={text.floorArea} value={formik.values.area ? Number(formik.values.area).toLocaleString("en-US") + " m²" : "—"} />
							<ReviewCard label={text.city} value={[formik.values.city, formik.values.region].filter(Boolean).join(", ") || "—"} />
							<ReviewCard label={text.facilities} value={[
								formik.values.electricity && text.electricity,
								formik.values.water && text.water,
								formik.values.roadAccess && text.roadAccess,
								formik.values.parking && text.parking,
							].filter(Boolean).join(" · ") || "—"} />
						</SimpleGrid>
						<FormControl isRequired isInvalid={Boolean(formik.touched.files && formik.errors.files)}>
							<Flex align="center" justify="space-between" gap="3" wrap="wrap">
								<FormLabel htmlFor="business-photos" mb="0">{text.photos}</FormLabel>
								<Text fontSize="xs" color={muted}>{formik.values.files.length}/{MAX_PHOTOS} {text.wizard.photosCount}</Text>
							</Flex>
							<Text color={muted} fontSize="sm" mt="2" mb="3">{text.wizard.photoHelp}</Text>
							<Input id="business-photos" type="file" name="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple variant="filled" h="auto" minH="12" py="2" sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }} onChange={(event) => choosePhotos(event, formik)} />
							<FormErrorMessage>{String(formik.errors.files || "")}</FormErrorMessage>
						</FormControl>
						<Grid templateColumns="repeat(auto-fill, minmax(145px, 1fr))" gap="4">
							{formik.values.files.map((file: File, index: number) => <Box key={file.name + "-" + index} position="relative" overflow="hidden" borderRadius="xl" border="1px solid" borderColor={panelBorder}>
								<Image alt={text.photoPreview + " " + (index + 1)} w="full" h="150px" objectFit="cover" src={previews[index]} />
								<Button type="button" aria-label={text.removePhoto + " " + (index + 1)} position="absolute" top="2" right="2" size="sm" minW="8" h="8" p="0" borderRadius="full" onClick={() => removePhoto(index, formik)}><MdClose /></Button>
							</Box>)}
						</Grid>
					</Flex>}

					<Flex justify="space-between" align="center" gap="3" mt={{ base: 6, md: 8 }} pt="5" borderTop="1px solid" borderColor={panelBorder}>
						<Button type="button" variant="ghost" onClick={() => router.push("/dashboard")} leftIcon={<MdClose />} display="inline-flex">{text.cancel}</Button>
						<Flex ml="auto" gap="3">
							{step > 0 && <Button type="button" variant="outline" leftIcon={<MdArrowBack />} onClick={() => setStep((current) => current - 1)}>{text.wizard.back}</Button>}
							{step < steps.length - 1 ? <Button type="button" colorScheme="orange" rightIcon={<MdArrowForward />} onClick={() => nextStep(formik)}>{text.wizard.next}</Button> : <Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={formik.isSubmitting}>{text.submit}</Button>}
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};

function SelectField({ formik, name, label, options, required = false, onChange }: { formik: any; name: string; label: string; options: Array<[string, string]>; required?: boolean; onChange?: (value: string) => void }) {
	return <FormControl isRequired={required} isInvalid={Boolean(formik.touched[name] && formik.errors[name])}>
		<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">{label}</FormLabel>
		<Select id={name} name={name} value={formik.values[name]} onChange={onChange ? (event) => onChange(event.target.value) : formik.handleChange} onBlur={formik.handleBlur} variant="filled" h="12">
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
